const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./frequencia.db');

function importarAbril(csvPath) {
    if (!fs.existsSync(csvPath)) {
        console.log('❌ Arquivo CSV não encontrado:', csvPath);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const separator = lines[0].includes(',') ? ',' : ';';
    const header = lines[0].split(separator).map(col => col.trim().replace(/"/g, ''));
    
    let abrilCol = -1;
    header.forEach((col, index) => {
        const colLower = col.toLowerCase();
        if (colLower.includes('abril') || colLower.includes('abr')) {
            abrilCol = index;
        }
    });
    
    if (abrilCol === -1) {
        console.log('❌ Coluna de Abril não encontrada');
        return;
    }
    
    let importados = 0;
    let erros = 0;
    
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const columns = lines[lineIndex].split(separator).map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 2) continue;
        
        const nome = columns[0];
        if (!nome) continue;
        
        const valorAbril = columns[abrilCol];
        if (valorAbril && valorAbril !== '' && valorAbril !== '0') {
            db.get('SELECT id FROM pessoas WHERE nome = ?', [nome], (err, pessoa) => {
                if (err) {
                    console.log(`❌ Erro ao buscar ${nome}:`, err.message);
                    erros++;
                    return;
                }
                
                if (pessoa) {
                    db.run(
                        'INSERT INTO frequencias (pessoa_id, tipo, numero_senha, data, created_at) VALUES (?, ?, ?, ?, ?)',
                        [pessoa.id, 'comum', valorAbril, '2025-04-06', new Date().toISOString()],
                        function(err) {
                            if (err) {
                                console.log(`❌ Erro ao inserir frequência para ${nome}:`, err.message);
                                erros++;
                            } else {
                                importados++;
                                console.log(`✅ ${nome} - Abril: ${valorAbril}`);
                            }
                        }
                    );
                } else {
                    console.log(`⚠️ Pessoa não encontrada: ${nome}`);
                    erros++;
                }
            });
        }
    }
    
    setTimeout(() => {
        console.log(`\n📊 IMPORTAÇÃO ABRIL CONCLUÍDA:`);
        console.log(`✅ Importados: ${importados}`);
        console.log(`❌ Erros: ${erros}`);
        db.close();
    }, 2000);
}

const csvFile = process.argv[2];
if (!csvFile) {
    console.log('❌ Uso: node importar_abril.js <arquivo.csv>');
    process.exit(1);
}

importarAbril(csvFile);