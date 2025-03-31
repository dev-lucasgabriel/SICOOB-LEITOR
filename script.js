function analisarArquivo() {
    const inputFile = document.getElementById('arquivo');
    const arquivo = inputFile.files[0];

    if (!arquivo) {
        alert("Por favor, selecione um arquivo!");
        return;
    }

    const tipoArquivo = arquivo.type;
    const nomeArquivo = arquivo.name.toLowerCase();
    const reader = new FileReader();

    // Primeiro, defina o onload
    reader.onload = function(event) {
        const conteudo = event.target.result;

        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('pdf-preview').innerHTML = '';
        document.getElementById('resultados').innerHTML = '';

        console.log("Arquivo lido com sucesso:", conteudo.slice(0, 200));

        if (tipoArquivo.startsWith("text/") || nomeArquivo.endsWith(".ret")) {
            const resultados = nomeArquivo.endsWith('.ret') ?
                analisarConteudoRET(conteudo) :
                analisarConteudo(conteudo);

            if (nomeArquivo.endsWith('.ret')) {
                mostrarResultadosRET(resultados);
            } else {
                mostrarResultados(resultados);
            }
        } else if (tipoArquivo.startsWith("image/")) {
            mostrarImagem(conteudo);
        } else if (tipoArquivo === "application/pdf") {
            const typedArray = new Uint8Array(event.target.result);
            mostrarPdf(typedArray);
        } else {
            alert("Formato de arquivo não suportado.");
        }
    };

    // Depois, inicie a leitura
    if (tipoArquivo.startsWith("text/") || nomeArquivo.endsWith(".ret")) {
        reader.readAsText(arquivo, 'windows-1252');
    } else if (tipoArquivo.startsWith("image/")) {
        reader.readAsDataURL(arquivo);
    } else if (tipoArquivo === "application/pdf") {
        reader.readAsArrayBuffer(arquivo);
    }
}

function analisarConteudo(conteudo) {
    const linhas = conteudo.split('\n');
    const palavras = conteudo.split(/\s+/);
    const palavrasUnicas = new Set(palavras);
    const contagemPalavras = contarPalavrasFrequentes(palavras);
    const comprimentoPalavras = palavras.map(palavra => palavra.length);
    const mediaComprimento = comprimentoPalavras.length
        ? comprimentoPalavras.reduce((sum, length) => sum + length, 0) / comprimentoPalavras.length
        : 0;

    return {
        tamanhoArquivo: conteudo.length,
        numLinhas: linhas.length,
        numPalavras: palavras.length,
        numCaracteres: conteudo.length,
        numPalavrasUnicas: palavrasUnicas.size,
        contagemPalavras,
        mediaComprimento
    };
}

function analisarConteudoRET(conteudo) {
    const linhas = conteudo.split('\n');

    return linhas.map(linha => {
        if (linha.length < 165 || linha[0] !== '1') return null;

        return {
            tipoRegistro: linha.substring(0, 1),
            agencia: linha.substring(17, 21).trim(),
            conta: linha.substring(23, 30).trim(),
            nossoNumero: linha.substring(62, 70).trim(),
            numeroDocumento: linha.substring(116, 126).trim(),
            carteira: linha.substring(107, 108).trim(),
            codigoOcorrencia: linha.substring(108, 110).trim(),
            dataVencimento: formatarData(linha.substring(146, 152)),
            valorTitulo: parseFloat(linha.substring(152, 165)) / 100,
            cpfCnpj: linha.substring(219, 233).trim()
        };
    }).filter(item => item);
}

function formatarData(dataStr) {
    if (!dataStr || dataStr.length !== 6) return '';
    const dia = dataStr.substring(0, 2);
    const mes = dataStr.substring(2, 4);
    const ano = '20' + dataStr.substring(4, 6);
    return `${dia}/${mes}/${ano}`;
}

function contarPalavrasFrequentes(palavras) {
    const contagem = {};
    palavras.forEach(palavra => {
        contagem[palavra] = (contagem[palavra] || 0) + 1;
    });

    return Object.entries(contagem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
}

function mostrarResultados(resultados) {
    const div = document.getElementById('resultados');
    div.innerHTML = `
        <div><strong>Tamanho do arquivo:</strong> ${resultados.tamanhoArquivo} caracteres</div>
        <div><strong>Número de linhas:</strong> ${resultados.numLinhas}</div>
        <div><strong>Número de palavras:</strong> ${resultados.numPalavras}</div>
        <div><strong>Número de caracteres:</strong> ${resultados.numCaracteres}</div>
        <div><strong>Número de palavras únicas:</strong> ${resultados.numPalavrasUnicas}</div>
        <div><strong>Média de comprimento das palavras:</strong> ${resultados.mediaComprimento.toFixed(2)}</div>
        <div><strong>Palavras mais frequentes:</strong></div>
        <ul>
            ${resultados.contagemPalavras.map(([palavra, freq]) => `<li>${palavra}: ${freq}</li>`).join('')}
        </ul>
    `;
}

function mostrarResultadosRET(registros) {
    const div = document.getElementById("resultados");

    if (!registros.length) {
        div.innerHTML = "<p>Nenhum registro de transação encontrado.</p>";
        return;
    }

    let html = `<table border="1" cellpadding="5">
        <tr>
            <th>Agência</th>
            <th>Conta</th>
            <th>Nosso Número</th>
            <th>Nº Documento</th>
            <th>Carteira</th>
            <th>Ocorrência</th>
            <th>Vencimento</th>
            <th>Valor (R$)</th>
            <th>CPF/CNPJ</th>
        </tr>`;

    registros.forEach(item => {
        html += `<tr>
            <td>${item.agencia}</td>
            <td>${item.conta}</td>
            <td>${item.nossoNumero}</td>
            <td>${item.numeroDocumento}</td>
            <td>${item.carteira}</td>
            <td>${item.codigoOcorrencia}</td>
            <td>${item.dataVencimento}</td>
            <td>R$ ${item.valorTitulo.toFixed(2)}</td>
            <td>${item.cpfCnpj}</td>
        </tr>`;
    });

    html += "</table>";
    div.innerHTML = html;
}

function mostrarImagem(conteudo) {
    const img = document.createElement("img");
    img.src = conteudo;
    img.style.maxWidth = "100%";
    document.getElementById("image-preview").appendChild(img);
}

function mostrarPdf(typedArray) {
    pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
        pdf.getPage(1).then(function(page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            page.render({ canvasContext: context, viewport });
            document.getElementById("pdf-preview").appendChild(canvas);
        });
    });
}
