package main

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// In production, set this in your Netlify Environment Variables: MINESWEEPER_SECRET
// It MUST be exactly 32 bytes long for AES-256.
func getSecretKey() []byte {
	key := os.Getenv("MINESWEEPER_SECRET")
	if len(key) == 32 {
		return []byte(key)
	}
	// Fallback key ONLY for local development. Do not use in production!
	return []byte("zlc-minesweeper-secret-key-32byt")
}

// GameState represents the data we hide inside the encrypted token
type GameState struct {
	GameId   string `json:"gameId"`
	GridSize int    `json:"gridSize"`
	MinePos  int    `json:"minePos"`
	Revealed []int  `json:"revealed"`
}

type RequestPayload struct {
	Action         string `json:"action"` // "INIT" or "CLICK"
	GridSize       int    `json:"gridSize,omitempty"`
	GameStateToken string `json:"gameStateToken,omitempty"`
	CellIndex      int    `json:"cellIndex,omitempty"`
}

type ResponsePayload struct {
	Status         string `json:"status"` // "playing", "won", "lost", "error"
	GameStateToken string `json:"gameStateToken,omitempty"`
	RevealedCount  int    `json:"revealedCount"`
	MinePos        int    `json:"minePos"` // Sent back ONLY when the game is over
	Message        string `json:"message,omitempty"`
}

func encryptState(state GameState) (string, error) {
	plaintext, err := json.Marshal(state)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(getSecretKey())
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, plaintext, nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func decryptState(token string) (*GameState, error) {
	data, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(getSecretKey())
	if err != nil {
		return nil, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	var state GameState
	err = json.Unmarshal(plaintext, &state)
	return &state, err
}

func generateGameId() string {
	b := make([]byte, 8)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}

func secureRandomInt(max int) int {
	n, _ := rand.Int(rand.Reader, big.NewInt(int64(max)))
	return int(n.Int64())
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod != "POST" {
		return jsonResponse(ResponsePayload{Status: "error", Message: "Method Not Allowed"}, 405)
	}

	var req RequestPayload
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(ResponsePayload{Status: "error", Message: "Invalid JSON"}, 400)
	}

	switch req.Action {
	case "INIT":
		gridSize := req.GridSize
		if gridSize <= 0 {
			gridSize = 7
		}
		totalCells := gridSize * gridSize
		minePos := secureRandomInt(totalCells)

		state := GameState{
			GameId:   generateGameId(),
			GridSize: gridSize,
			MinePos:  minePos,
			Revealed: []int{},
		}

		token, err := encryptState(state)
		if err != nil {
			return jsonResponse(ResponsePayload{Status: "error", Message: "Internal Error"}, 500)
		}

		return jsonResponse(ResponsePayload{
			Status:         "playing",
			GameStateToken: token,
			RevealedCount:  0,
			MinePos:        -1, // Hiding the mine
		}, 200)

	case "CLICK":
		state, err := decryptState(req.GameStateToken)
		if err != nil {
			return jsonResponse(ResponsePayload{Status: "error", Message: "Invalid or tampered token"}, 400)
		}

		cellIndex := req.CellIndex
		totalCells := state.GridSize * state.GridSize
		safeCells := totalCells - 1

		// Prevent double click on same cell
		for _, r := range state.Revealed {
			if r == cellIndex {
				return jsonResponse(ResponsePayload{Status: "playing", GameStateToken: req.GameStateToken, RevealedCount: len(state.Revealed), MinePos: -1}, 200)
			}
		}

		// Hit the mine!
		if cellIndex == state.MinePos {
			return jsonResponse(ResponsePayload{
				Status:        "lost",
				RevealedCount: len(state.Revealed),
				MinePos:       state.MinePos, // Reveal mine location since game is over
			}, 200)
		}

		// Safe cell
		state.Revealed = append(state.Revealed, cellIndex)
		revealedCount := len(state.Revealed)

		if revealedCount == safeCells {
			return jsonResponse(ResponsePayload{
				Status:        "won",
				RevealedCount: revealedCount,
				MinePos:       state.MinePos, // Reveal mine location since game is over
			}, 200)
		}

		// Continue playing
		newToken, err := encryptState(*state)
		if err != nil {
			return jsonResponse(ResponsePayload{Status: "error", Message: "Encryption failed"}, 500)
		}

		return jsonResponse(ResponsePayload{
			Status:         "playing",
			GameStateToken: newToken,
			RevealedCount:  revealedCount,
			MinePos:        -1,
		}, 200)

	default:
		return jsonResponse(ResponsePayload{Status: "error", Message: "Unknown action"}, 400)
	}
}

func jsonResponse(payload ResponsePayload, statusCode int) (*events.APIGatewayProxyResponse, error) {
	body, _ := json.Marshal(payload)
	return &events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}
