const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./frequencia.db');

function importarSetembro(csvPath) {
    if (!fs.existsSync(csvPath)) {
        console.log('❌ Arquivo CSV não encontrado:', csvPath);
        return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const separator = lines[0].includes(',') ? ',' : ';';
    const header = lines[0].split(separator).map(col => col.trim().replace(/"/g, ''));
    
    let setembroCol = -1;
    header.forEach((col, index) => {
        const colLower = col.toLowerCase();
        if (colLower.includes('setembro') || colLower.includes('set')) {
            setembroCol = index;
        }
    });
    
    if (setembroCol === -1) {
        console.log('❌ Coluna de Setembro não encontrada');
        return;
    }
    
    let importados = 0;
    let erros = 0;
    
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const columns = lines[lineIndex].split(separator).map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 2) continue;
        
        const nome = columns[0];
        if (!nome) continue;
        
        const valorSetembro = columns[setembroCol];
        if (valorSetembro && valorSetembro !== '' && valorSetembro !== '0') {
            db.get('SELECT id FROM pessoas WHERE nome = ?', [nome], (err, pessoa) => {
                if (err) {
                    console.log(`❌ Erro ao buscar ${nome}:`, err.message);
                    erros++;
                    return;
                }
                
                if (pessoa) {
                    db.run(
                        'INSERT INTO frequencias (pessoa_id, tipo, numero_senha, data, created_at) VALUES (?, ?, ?, ?, ?)',
                        [pessoa.id, 'comum', valorSetembro, '2025-09-07', new Date().toISOString()],
                        function(err) {
                            if (err) {
                                console.log(`❌ Erro ao inserir frequência para ${nome}:`, err.message);
                                erros++;
                            } else {
                                importados++;
                                console.log(`✅ ${nome} - Setembro: ${valorSetembro}`);
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
        console.log(`\n📊 IMPORTAÇÃO SETEMBRO CONCLUÍDA:`);
        console.log(`✅ Importados: ${importados}`);
        console.log(`❌ Erros: ${erros}`);
        db.close();
    }, 2000);
}

const csvFile = process.argv[2];
if (!csvFile) {
    console.log('❌ Uso: node importar_setembro.js <arquivo.csv>');
    process.exit(1);
}

importarSetembro(csvFile);