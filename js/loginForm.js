const loginForm = document.getElementById('loginForm');


const API_URL = window.location.hostname === "localhost" 
    ? "http://localhost:8080" 
    : "https://library-management-api-3d5q.onrender.com"; 

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Submit detectado");
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;    

    const user = {
        username: username,
        password: password
    };

    fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Credenciales inválidas");
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem("token", data.token);
        console.log("Login exitoso");
        
        // Opcional: Redirigir a otra página tras el login exitoso
        // window.location.href = "/dashboard.html"; 
    })
    .catch(error => {
        console.error("Error de login:", error);
        alert("Usuario o contraseña incorrectos");
    });
});