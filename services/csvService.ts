
import { Student } from "../types";

export const downloadTemplateCSV = () => {
  const headers = ["Nome do Aluno"];
  const rows = [
    ["João da Silva"],
    ["Maria Oliveira"],
    ["Pedro Santos"]
  ];

  // O caractere \uFEFF é o BOM (Byte Order Mark). 
  // Ele avisa ao Excel que o arquivo está em UTF-8, corrigindo a exibição de acentos.
  const csvContent = "\uFEFF" + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "modelo_importacao_alunos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseStudentsCSV = (content: string): Partial<Student>[] => {
  const lines = content.split('\n');
  const students: Partial<Student>[] = [];

  // Pula o cabeçalho (i=1)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      // Remove aspas se houver, para evitar problemas com nomes que contenham vírgulas
      const cleanLine = line.replace(/"/g, ''); 
      const columns = cleanLine.split(',');
      if (columns.length >= 1) {
        students.push({
          name: columns[0].trim(),
        });
      }
    }
  }
  return students;
};
