const loginForm = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
      mensagem.textContent = "Informe usuário e senha.";
      mensagem.className = "mensagem erro";
      return;
    }

    try {
      const response = await fetch("api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Usuário ou senha inválidos.");
      }

      mensagem.textContent = `Acesso autorizado para ${data.nome}.`;
      mensagem.className = "mensagem sucesso";

      setTimeout(() => {
        window.location.href = "camera.html";
      }, 400);
    } catch (error) {
      mensagem.textContent = error.message;
      mensagem.className = "mensagem erro";
    }
  });
}