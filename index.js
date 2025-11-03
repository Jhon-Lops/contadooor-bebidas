let bebidas = JSON.parse(localStorage.getItem("bebidas")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];

function salvar() {
  localStorage.setItem("bebidas", JSON.stringify(bebidas));
  localStorage.setItem("historico", JSON.stringify(historico));
}

function atualizarLista() {
  const container = document.getElementById("bebidasContainer");
  container.innerHTML = "";

  // Ordenar por nome (ordem alfabética)
  bebidas.sort((a, b) => a.nome.localeCompare(b.nome));

  bebidas.forEach((b, i) => {
    const div = document.createElement("div");
    div.className = "bebida";
    div.innerHTML = `
      <span>${b.nome}: ${b.quantidade}ml</span>
      <div class="botoes">
        <button onclick="dosar(${i})">-50ml</button>
        <button onclick="adicionar50(${i})">+50ml</button>
        <button onclick="remover(${i})">Remover</button>
      </div>
    `;
    container.appendChild(div);
  });

  atualizarHistorico();
}

function adicionarBebida() {
  const nome = document.getElementById("nomeBebida").value.trim();
  const quantidade = parseInt(document.getElementById("quantidadeML").value);

  if (!nome || isNaN(quantidade) || quantidade <= 0) {
    alert("Preencha os campos corretamente!");
    return;
  }

  bebidas.push({ nome, quantidade });
  salvar();
  atualizarLista();

  document.getElementById("nomeBebida").value = "";
  document.getElementById("quantidadeML").value = "";
}

function dosar(i) {
  if (bebidas[i].quantidade >= 50) {
    bebidas[i].quantidade -= 50;
    registrarHistorico(bebidas[i].nome, "-50ml");
    salvar();
    atualizarLista();
  } else {
    alert("A bebida acabou!");
  }
}

function adicionar50(i) {
  bebidas[i].quantidade += 50;
  registrarHistorico(bebidas[i].nome, "+50ml (ajuste)");
  salvar();
  atualizarLista();
}

function remover(i) {
  if (confirm("Deseja remover esta bebida?")) {
    bebidas.splice(i, 1);
    salvar();
    atualizarLista();
  }
}

function registrarHistorico(nome, acao) {
  const data = new Date();
  historico.push({
    nome,
    acao,
    hora: data.toLocaleTimeString(),
    data: data.toLocaleDateString()
  });
  salvar();
  atualizarHistorico();
}

function atualizarHistorico() {
  const lista = document.getElementById("listaHistorico");
  lista.innerHTML = "";
  historico.slice(-20).reverse().forEach(item => {
    const li = document.createElement("li");
    li.textContent = `[${item.data} ${item.hora}] ${item.nome} ${item.acao}`;
    lista.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", atualizarLista);
