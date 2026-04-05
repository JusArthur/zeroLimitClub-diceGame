package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"math/big"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Prize struct {
	Index  int    `json:"index"`
	Name   string `json:"name"`
	Weight int64  `json:"-"`
}

type ResponsePayload struct {
	Index     int    `json:"index"`
	PrizeName string `json:"prizeName"`
}

// Weights defined exactly as your frontend previously had them
var prizeConfig = []Prize{
	{Index: 0, Name: "保底增加488w", Weight: 70},
	{Index: 1, Name: "保底增加788w", Weight: 24},
	{Index: 2, Name: "288小金单", Weight: 4},
	{Index: 3, Name: "388爽吃大保险单", Weight: 1},
	{Index: 4, Name: "1111.11现金红包", Weight: 0},
	{Index: 5, Name: "非洲之心不出不结单", Weight: 0},
}

func secureSpin() Prize {
	var totalWeight int64 = 0
	for _, p := range prizeConfig {
		totalWeight += p.Weight
	}

	n, err := rand.Int(rand.Reader, big.NewInt(totalWeight))
	if err != nil {
		return prizeConfig[0]
	}

	randomVal := n.Int64()
	var current int64 = 0

	for _, p := range prizeConfig {
		current += p.Weight
		if randomVal < current {
			return p
		}
	}
	return prizeConfig[0]
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod != "POST" {
		return &events.APIGatewayProxyResponse{StatusCode: 405, Body: `{"error": "Method Not Allowed"}`}, nil
	}

	result := secureSpin()

	payload := ResponsePayload{
		Index:     result.Index,
		PrizeName: result.Name,
	}

	body, _ := json.Marshal(payload)

	return &events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(body),
	}, nil
}

func main() {
	lambda.Start(handler)
}
