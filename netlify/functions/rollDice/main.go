package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"math/big"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type RequestPayload struct {
	DiceCount int `json:"diceCount"`
}

type BoResult struct {
	Name        string `json:"name"`
	Level       int    `json:"level"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type ResponsePayload struct {
	DiceValues []int     `json:"diceValues"`
	Result     *BoResult `json:"result"`
}

func secureRoll() int {
	// Generates a secure random integer between 0 and 5
	n, err := rand.Int(rand.Reader, big.NewInt(6))
	if err != nil {
		return 1 // Fallback in extreme failure cases
	}
	// Add 1 to get standard 1-6 dice range
	return int(n.Int64()) + 1
}

func checkBoResult(values []int) *BoResult {
	if len(values) != 6 {
		return nil
	}

	counts := make(map[int]int)
	for _, val := range values {
		counts[val]++
	}

	// 红六勃：6个4
	if counts[4] == 6 {
		return &BoResult{"状元·六杯红", 10, "六个四,状元及第,至尊荣耀!", "#dc2626"}
	}
	// 遍地锦：6个1
	if counts[1] == 6 {
		return &BoResult{"状元·遍地锦", 9, "六个一,状元及第,极致稀有!", "#dc2626"}
	}
	// 黑六勃：6个相同 (2, 3, 5, 6)
	for _, i := range []int{2, 3, 5, 6} {
		if counts[i] == 6 {
			return &BoResult{"状元·黑六勃", 8, "六子同辉,状元及第,独步天下!", "#1f2937"}
		}
	}
	// 插金花：4个4 + 2个1
	if counts[4] == 4 && counts[1] == 2 {
		return &BoResult{"状元·插金花", 7, "四个四加两个一,状元及第,锦上添花!", "#f59e0b"}
	}
	// 五红：5个4
	if counts[4] == 5 {
		return &BoResult{"状元·五红", 6, "五个四,状元及第,鸿运当头!", "#dc2626"}
	}
	// 五子登科：5个相同 (1, 2, 3, 5, 6)
	for _, i := range []int{1, 2, 3, 5, 6} {
		if counts[i] == 5 {
			return &BoResult{"状元·五子登科", 6, "五子同科,状元及第,喜气盈门!", "#dc2626"}
		}
	}
	// 四红：4个4
	if counts[4] == 4 {
		return &BoResult{"状元·四红", 5, "四个四,状元及第,运势非凡!", "#dc2626"}
	}
	// 榜眼：123456顺子
	hasAllNumbers := true
	for i := 1; i <= 6; i++ {
		if counts[i] != 1 {
			hasAllNumbers = false
			break
		}
	}
	if hasAllNumbers {
		return &BoResult{"榜眼", 4, "顺子齐聚,才华横溢,榜眼之选!", "#7c3aed"}
	}
	// 探花：3个4
	if counts[4] == 3 {
		return &BoResult{"探花", 3, "三个四,风华出众,探花之姿!", "#dc2626"}
	}
	// 进士：4个相同 (1, 2, 3, 5, 6)
	for _, i := range []int{1, 2, 3, 5, 6} {
		if counts[i] == 4 {
			return &BoResult{"进士", 2, "四子齐聚,才学兼备,进士及第!", "#1f2937"}
		}
	}
	// 举人：2个4
	if counts[4] == 2 {
		return &BoResult{"举人", 1, "两个四,实力不凡,稳入举人!", "#dc2626"}
	}
	// 秀才：1个4
	if counts[4] == 1 {
		return &BoResult{"秀才", 0, "一个四,初露锋芒,秀才入门!", "#dc2626"}
	}

	// 无奖
	return &BoResult{"无奖", -1, "未中佳手,再接再厉!", "#6b7280"}
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod != "POST" {
		return &events.APIGatewayProxyResponse{StatusCode: 405, Body: "Method Not Allowed"}, nil
	}

	var reqPayload RequestPayload
	err := json.Unmarshal([]byte(request.Body), &reqPayload)
	if err != nil || reqPayload.DiceCount <= 0 {
		reqPayload.DiceCount = 6 // Default to 6 if parsing fails
	}

	values := make([]int, reqPayload.DiceCount)
	for i := 0; i < reqPayload.DiceCount; i++ {
		values[i] = secureRoll()
	}

	result := checkBoResult(values)

	payload := ResponsePayload{
		DiceValues: values,
		Result:     result,
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
