package main

import (
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

func main() {
	e := echo.New()
	e.HideBanner = true

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok", "service": "echo"})
	})
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]any{"service": "echo", "endpoints": []string{"/health"}})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	// ":" + port listens on every interface, which Traefik needs inside the container network.
	e.Logger.Fatal(e.Start(":" + port))
}
