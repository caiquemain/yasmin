import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateObraPDF(obra: any, checklist: any[], parcelas: any[]) {
  const doc = new jsPDF();
  
  // Cores do nosso design system tipadas corretamente (Tupla RGB)
  const primaryColor: [number, number, number] = [200, 90, 126]; // Rosa
  const darkColor: [number, number, number] = [74, 35, 48]; // Vinho escuro
  const grayColor: [number, number, number] = [168, 140, 149]; // Cinza rosado
  const bgLightColor: [number, number, number] = [253, 246, 248]; // Fundo rosado clarinho

  // --- CABEÇALHO ---
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...darkColor);
  doc.text('Yasmin.', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('CADERNO DE PROJETOS E PRONTUÁRIOS TÉCNICOS', 14, 26);

  // Linha divisória
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(14, 30, 196, 30);

  // --- DADOS DA OBRA ---
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(obra.nome, 14, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text(`Cliente: ${obra.clientes?.nome || 'Não informado'}`, 14, 52);
  
  const infoText = [];
  if (obra.area_m2) infoText.push(`Área: ${obra.area_m2} m²`);
  infoText.push(`Status: ${obra.status_obra.toUpperCase()}`);
  if (obra.art_status) infoText.push(`ART: ${obra.art_status.replace('_', ' ').toUpperCase()} ${obra.art_numero ? `(${obra.art_numero})` : ''}`);
  
  doc.text(infoText.join('   |   '), 14, 58);

  // --- PREMISSAS DE CÁLCULO ---
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('Premissas de Cálculo', 14, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const premissas = [
    `fck: ${obra.premissa_fck ? obra.premissa_fck + ' MPa' : 'N/A'}`,
    `CAA: ${obra.premissa_caa || 'N/A'}`,
    `σsolo: ${obra.premissa_sigma_solo ? obra.premissa_sigma_solo + ' kPa' : 'N/A'}`,
    `Cobrimento: ${obra.premissa_cobrimento ? obra.premissa_cobrimento + ' mm' : 'N/A'}`,
  ];
  doc.text(premissas.join('     |     '), 14, 82);

  if (obra.premissa_outras) {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text(`Outras notas: ${obra.premissa_outras}`, 14, 88, { maxWidth: 180 });
  }

  // --- CHECKLIST ---
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('Checklist de Cálculo', 14, 100);

  const checklistBody = checklist.map((c, i) => [
    String(i + 1).padStart(2, '0'),
    c.titulo,
    c.concluido ? 'OK' : 'Pendente'
  ]);

  autoTable(doc, {
    startY: 105,
    head: [['#', 'Etapa', 'Status']],
    body: checklistBody,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: darkColor },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: bgLightColor },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 30, halign: 'center' }
    }
  });

  // --- FINANCEIRO ---
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text('Financeiro', 14, finalY);

  const totalPago = parcelas.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPendente = parcelas.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalGeral = totalPago + totalPendente;
  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total: ${formatBRL(totalGeral)}   |   Recebido: ${formatBRL(totalPago)}   |   A Receber: ${formatBRL(totalPendente)}`, 14, finalY + 7);

  const parcelasBody = parcelas.map(p => [
    p.descricao,
    p.data_prevista ? new Date(p.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR') : '-',
    p.status.toUpperCase(),
    formatBRL(Number(p.valor))
  ]);

  autoTable(doc, {
    startY: finalY + 12,
    head: [['Descrição', 'Data Prevista', 'Status', 'Valor']],
    body: parcelasBody,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, textColor: darkColor },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: bgLightColor },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' }
    }
  });

  // --- RODAPÉ ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 285);
    doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
  }

  // Salva o arquivo
  doc.save(`Ficha_Tecnica_${obra.nome.replace(/\s+/g, '_')}.pdf`);
}
