(() => {
  const raw = sessionStorage.getItem("faceid_resultado");
  let result = null;
  try { result = raw ? JSON.parse(raw) : null; } catch {}
  const title = document.getElementById("resultadoTitulo"), desc = document.getElementById("resultadoDescricao");
  const icon = document.getElementById("resultadoIcone"), profile = document.getElementById("perfil");
  if (!result || !result.encontrado || !result.pessoa) {
    title.textContent = "Pessoa não identificada";
    desc.textContent = "Não foi encontrada uma correspondência confiável. Tente novamente ou procure um responsável.";
    icon.textContent = "!";
    icon.classList.add("falha");
  } else {
    const p = result.pessoa;
    title.textContent = "Identificação localizada";
    desc.textContent = "Correspondência encontrada no cadastro local.";
    profile.hidden = false;
    document.getElementById("fotoPessoa").src = p.foto;
    document.getElementById("nomePessoa").textContent = p.nome;
    document.getElementById("idPessoa").textContent = p.identificador;
    document.getElementById("setorPessoa").textContent = p.setor;
    document.getElementById("cargoPessoa").textContent = p.cargo;
  }
  sessionStorage.removeItem("faceid_resultado");
})();