package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"math/big"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Card struct {
	Suit string `json:"suit"`
	Rank string `json:"rank"`
}

type Result struct {
	Name        string `json:"name"`
	Multiplier  string `json:"multiplier"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type ResponsePayload struct {
	Cards  []Card `json:"cards"`
	Result Result `json:"result"`
}

var suits = []string{"♠", "♥", "♦", "♣"}
var ranks = []string{"A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"}

// Probabilities mapping exactly to your frontend
const (
	ProbWuHuaNiu  = 0.0003
	ProbWuXiaoNiu = 0.000005
	ProbZhaDan    = 0.0002
	ProbNoNiu     = 0.2
	ProbNiuNiu    = 0.03
	ProbNiuJiu    = 0.05
	ProbNiuBa     = 0.06
)

// Secure random integer generator
func secureRandomInt(max int) int {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0
	}
	return int(n.Int64())
}

// Secure random float between 0.0 and 1.0 for probability checking
func secureRandomFloat() float64 {
	max := big.NewInt(1000000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return 1.0 // If crypto fails, fail safe (don't trigger rare)
	}
	return float64(n.Int64()) / 1000000000.0
}

func shouldTriggerRare(probability float64) bool {
	return secureRandomFloat() < probability
}

func getCardValue(rank string) int {
	if rank == "A" {
		return 1
	}
	if rank == "J" || rank == "Q" || rank == "K" {
		return 10
	}
	val, _ := strconv.Atoi(rank)
	return val
}

func generateRandomCard() Card {
	return Card{
		Suit: suits[secureRandomInt(len(suits))],
		Rank: ranks[secureRandomInt(len(ranks))],
	}
}

// Generates 5 purely random cards
func generatePureRandomHand() []Card {
	cards := make([]Card, 5)
	for i := 0; i < 5; i++ {
		cards[i] = generateRandomCard()
	}
	return cards
}

// Generates normal cards, attempting to avoid special hands
func generateNormalCards() []Card {
	for attempts := 0; attempts < 100; attempts++ {
		cards := generatePureRandomHand()
		res := checkNiuNiuResult(cards)
		// If it's a basic hand (not a rare one), return it
		if res.Name != "炸弹" && res.Name != "五小牛" && res.Name != "五花牛" &&
			res.Name != "牛牛" && res.Name != "牛九" && res.Name != "牛八" {
			return cards
		}
	}
	return generatePureRandomHand()
}

// Generates a specifically crafted hand to match a rigged probability
func generateSpecialHand(handType string) []Card {
	switch handType {
	case "zhaDan":
		bombRank := ranks[secureRandomInt(len(ranks))]
		cards := make([]Card, 5)
		for i := 0; i < 4; i++ {
			cards[i] = Card{Suit: suits[i], Rank: bombRank}
		}
		cards[4] = generateRandomCard()
		return cards

	case "wuXiaoNiu":
		smallRanks := []string{"A", "2", "3", "4"}
		for attempts := 0; attempts < 100; attempts++ {
			cards := make([]Card, 5)
			total := 0
			for i := 0; i < 5; i++ {
				r := smallRanks[secureRandomInt(len(smallRanks))]
				s := suits[secureRandomInt(len(suits))]
				cards[i] = Card{Suit: s, Rank: r}
				total += getCardValue(r)
			}
			if total <= 10 {
				return cards
			}
		}
		// Fallback
		return []Card{{"♠", "A"}, {"♥", "A"}, {"♦", "A"}, {"♣", "A"}, {"♠", "2"}}

	case "wuHuaNiu":
		flowerRanks := []string{"J", "Q", "K"}
		cards := make([]Card, 5)
		for i := 0; i < 5; i++ {
			cards[i] = Card{
				Suit: suits[secureRandomInt(len(suits))],
				Rank: flowerRanks[secureRandomInt(len(flowerRanks))],
			}
		}
		return cards

	case "niuNiu":
		for attempts := 0; attempts < 100; attempts++ {
			cards := generatePureRandomHand()
			if checkNiuNiuResult(cards).Name == "牛牛" {
				return cards
			}
		}
		return generateNormalCards()

	case "niuJiu":
		for attempts := 0; attempts < 100; attempts++ {
			cards := generatePureRandomHand()
			if checkNiuNiuResult(cards).Name == "牛九" {
				return cards
			}
		}
		return generateNormalCards()

	case "niuBa":
		for attempts := 0; attempts < 100; attempts++ {
			cards := generatePureRandomHand()
			if checkNiuNiuResult(cards).Name == "牛八" {
				return cards
			}
		}
		return generateNormalCards()
	}
	return generateNormalCards()
}

// Master generator that enforces the configured probabilities
func generateHandWithPreference() []Card {
	if shouldTriggerRare(ProbZhaDan) {
		return generateSpecialHand("zhaDan")
	} else if shouldTriggerRare(ProbWuXiaoNiu) {
		return generateSpecialHand("wuXiaoNiu")
	} else if shouldTriggerRare(ProbWuHuaNiu) {
		return generateSpecialHand("wuHuaNiu")
	} else if shouldTriggerRare(ProbNoNiu) {
		for attempts := 0; attempts < 50; attempts++ {
			cards := generateNormalCards()
			if checkNiuNiuResult(cards).Name == "没牛" {
				return cards
			}
		}
	} else if shouldTriggerRare(ProbNiuNiu) {
		return generateSpecialHand("niuNiu")
	} else if shouldTriggerRare(ProbNiuJiu) {
		return generateSpecialHand("niuJiu")
	} else if shouldTriggerRare(ProbNiuBa) {
		return generateSpecialHand("niuBa")
	}
	return generateNormalCards()
}

func checkNiuNiuResult(hand []Card) Result {
	values := make([]int, 5)
	allFlowers := true
	allSmall := true
	sum := 0
	rankCounts := make(map[string]int)

	for i, c := range hand {
		v := getCardValue(c.Rank)
		values[i] = v
		sum += v
		rankCounts[c.Rank]++

		if c.Rank != "J" && c.Rank != "Q" && c.Rank != "K" {
			allFlowers = false
		}
		if v > 5 {
			allSmall = false
		}
	}

	// 1. Bomb
	for _, count := range rankCounts {
		if count == 4 {
			return Result{"炸弹", "x17", "四张相同！威力无穷！", "#dc2626"}
		}
	}

	// 2. Five Small
	if allSmall && sum <= 10 {
		return Result{"五小牛", "x20", "小牌大智慧！", "#f59e0b"}
	}

	// 3. Five Flowers
	if allFlowers {
		return Result{"五花牛", "x15", "满堂花开！", "#7c3aed"}
	}

	// 4. Calculate Niu
	bestNiu := -1

	for i := 0; i < 3; i++ {
		for j := i + 1; j < 4; j++ {
			for k := j + 1; k < 5; k++ {
				if (values[i]+values[j]+values[k])%10 == 0 {
					var remaining []int
					for idx := 0; idx < 5; idx++ {
						if idx != i && idx != j && idx != k {
							remaining = append(remaining, values[idx])
						}
					}
					niuValue := (remaining[0] + remaining[1]) % 10
					if niuValue > bestNiu {
						bestNiu = niuValue
					}
				}
			}
		}
	}

	chineseNumbers := []string{"零", "一", "二", "三", "四", "五", "六", "七", "八", "九"}

	if bestNiu == 0 {
		return Result{"牛牛", "x10", "完美组合！", "#059669"}
	} else if bestNiu > 0 {
		color := "#6b7280"
		desc := "小有收获！"
		if bestNiu >= 7 {
			color = "#059669"
			desc = "大牛来了！"
		}
		return Result{"牛" + chineseNumbers[bestNiu], "x" + strconv.Itoa(bestNiu), desc, color}
	}

	return Result{"没牛", "x0", "再接再厉！", "#9ca3af"}
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (*events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod != "POST" {
		return &events.APIGatewayProxyResponse{StatusCode: 405, Body: "Method Not Allowed"}, nil
	}

	// Use the rigged generator, not the pure random one
	cards := generateHandWithPreference()
	result := checkNiuNiuResult(cards)

	payload := ResponsePayload{
		Cards:  cards,
		Result: result,
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
