const loginForm = document.getElementById("loginForm");
const mensagem = document.getElementById("mensagem");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;
    // Credenciais demonstrativas; não use este login em produção.
    if (usuario === "admin" && senha === "1234") {
      mensagem.textContent = "Acesso autorizado.";
      mensagem.className = "mensagem sucesso";
      setTimeout(() => location.href = "camera.html", 400);
    } else {
      mensagem.textContent = "Usuário ou senha incorretos.";
      mensagem.className = "mensagem erro";
    }
  });
}