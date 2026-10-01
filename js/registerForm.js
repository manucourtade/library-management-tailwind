const registerForm = document.getElementById('registerForm');


const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:8080" 
    : "https://library-management-api-3d5q.onrender.com"; 

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Submit detectado");
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;    

    const user = {
        username: username,
        password: password
    };

    fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al registrar usuario");
        }
        return response.json();
    })
    .then(data => {
        console.log("Registro exitoso");
        window.location.href = "index.html"; // Redirigir a la página de inicio de sesión después del registro exitoso
        
    })
    .catch(error => {
        console.error("Error de registro:", error);
        alert("Error al registrar usuario");
    });
});