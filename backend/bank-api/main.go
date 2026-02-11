package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Bank API running")
	})

	fmt.Println("Bank API running on :8081")
	http.ListenAndServe(":8081", nil)
}
