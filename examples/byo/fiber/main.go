package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()
	app.Get("/health", func(c *fiber.Ctx) error { return c.JSON(fiber.Map{"status": "ok"}) })
	app.Get("/orders", func(c *fiber.Ctx) error {
		return c.JSON([]fiber.Map{{"id": 1, "item": "tea"}})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Fatal(app.Listen("0.0.0.0:" + port))
}
