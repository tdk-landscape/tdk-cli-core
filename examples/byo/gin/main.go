package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "gin"})
	})
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": "gin", "endpoints": []string{"/health"}})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	// ":" + port listens on every interface, which Traefik needs inside the container network.
	_ = r.Run(":" + port)
}
