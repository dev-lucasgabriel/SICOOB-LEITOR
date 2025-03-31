function analisarArquivo() {
    const inputFile = document.getElementById('arquivo');
    const arquivo = inputFile.files[0];

    if (!arquivo) {
        alert("Por favor, selecione um arquivo!");
        return;
    }

    const reader = new FileReader();
    const tipoArquivo = arquivo.type;

    reader.onload = function(event) {
        const conteudo = event.target.result;

        // Limpar visualizações anteriores
        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('pdf-preview').innerHTML = '';
        document.getElementById('resultados').innerHTML = '';

        if (tipoArquivo.startsWith("text/")) {
            const resultados = analisarConteudo(conteudo);
            mostrarResultados(resultados);
        } else if (tipoArquivo.startsWith("image/")) {
            mostrarImagem(conteudo);
        } else if (tipoArquivo === "application/pdf") {
            mostrarPdf(conteudo);
        } else {
            alert("Formato de arquivo não suportado.");
        }
    };

    if (tipoArquivo.startsWith("text/")) {
        reader.readAsText(arquivo);  // Para arquivos de texto
    } else if (tipoArquivo.startsWith("image/")) {
        reader.readAsDataURL(arquivo);  // Para imagens
    } else if (tipoArquivo === "application/pdf") {
        reader.readAsArrayBuffer(arquivo);  // Para PDF
    }
}

function analisarConteudo(conteudo) {
    const linhas = conteudo.split('\n');
    const palavras = conteudo.split(/\s+/);
    const palavrasUnicas = new Set(palavras);
    const contagemPalavras = contarPalavrasFrequentes(palavras);
    const comprimentoPalavras = palavras.map(palavra => palavra.length);
    const mediaComprimento = comprimentoPalavras.length ? 
        comprimentoPalavras.reduce((sum, length) => sum + length) / comprimentoPalavras.length 
        : 0;

    return {
        tamanhoArquivo: conteudo.length,
        numLinhas: linhas.length,
        numPalavras: palavras.length,
        numCaracteres: conteudo.length,
        numPalavrasUnicas: palavrasUnicas.size,
        contagemPalavras: contagemPalavras,
        mediaComprimento: mediaComprimento
    };
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
    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = `
        <div><strong>Tamanho do arquivo:</strong> ${resultados.tamanhoArquivo} caracteres</div>
        <div><strong>Número de linhas:</strong> ${resultados.numLinhas}</div>
        <div><strong>Número de palavras:</strong> ${resultados.numPalavras}</div>
        <div><strong>Número de caracteres:</strong> ${resultados.numCaracteres}</div>
        <div><strong>Número de palavras únicas:</strong> ${resultados.numPalavrasUnicas}</div>
        <div><strong>Média de comprimento das palavras:</strong> ${resultados.mediaComprimento.toFixed(2)}</div>
        <div><strong>Palavras mais frequentes:</strong></div>
        <ul>
            ${resultados.contagemPalavras.map(item => `<li>${item[0]}: ${item[1]}</li>`).join('')}
        </ul>
    `;
}

function mostrarImagem(conteudo) {
    const imgElement = document.createElement("img");
    imgElement.src = conteudo;
    document.getElementById("image-preview").appendChild(imgElement);
}

function mostrarPdf(conteudo) {
    const typedArray = new Uint8Array(conteudo);

    pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
        pdf.getPage(1).then(function(page) {
            const scale = 1.5;
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            page.render({
                canvasContext: context,
                viewport: viewport
            });

            document.getElementById("pdf-preview").appendChild(canvas);
        });
    });
}
