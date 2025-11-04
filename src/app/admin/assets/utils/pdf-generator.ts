import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AssetData } from '@/lib/adminasset'
import { ScanHistory } from '@/lib/adminasset'
import { ApiSubAsset } from '../types'
import { getAssetClassification } from './asset-helpers'
import { fetchMaintenanceLogsForAsset } from './maintenance-api'

/**
 * Generate PDF report for asset classification
 */
export const generatePDF = async (asset: AssetData) => {
  const doc = new jsPDF()
  const assetClassification = getAssetClassification(asset)
 
  let yPosition = 15
 
  // Clean Header Design
  try {
    // Add EXOZEN logo image
    const logoUrl = '/exozen_logo1.png'
    doc.addImage(logoUrl, 'PNG', 15, 8, 30, 12)
  } catch {
    // Fallback to text if image fails to load
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('EXOZEN', 15, 18)
  }
 
  // Report Title and Asset Info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Asset Classification Report', 50, 12)
 
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Asset ID: ${asset.tagId}`, 50, 18)
 
  // Date and Brand Info
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 12)
  doc.text(`Type: ${asset.assetType}`, 150, 16)
  doc.text(`Brand: ${asset.brand}`, 150, 20)
 
  // Header separator line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(15, 25, 195, 25)
 
  yPosition = 35
 
  // Two Column Layout
  const leftColumnX = 15
  const rightColumnX = 110
  const columnWidth = 85
 
  // Left Column - Asset Overview Table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Asset Overview', leftColumnX, yPosition)
  yPosition += 8
 
  const overviewData = [
    ['Asset ID', asset.tagId],
    ['Asset Type', asset.assetType],
    ['Subcategory', asset.subcategory || 'N/A'],
    ['Brand', asset.brand],
    ['Model', asset.model || 'N/A'],
    ['Capacity', asset.capacity || 'N/A'],
    ['Status', asset.status || 'Active'],
    ['Priority', asset.priority || 'Medium'],
    ['Location', asset.location ? `${asset.location.building}, ${asset.location.floor}, ${asset.location.room}` : 'Not Set']
  ]
 
  autoTable(doc, {
    startY: yPosition,
    head: [['Property', 'Value']],
    body: overviewData,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header background
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      lineColor: [37, 99, 235], // Darker blue border
      lineWidth: 0.5
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [220, 220, 220],
      lineWidth: 0.3
    },
    margin: { left: leftColumnX, right: 15 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 45 }
    },
  })
 
  const leftTableEndY = doc.lastAutoTable.finalY
 
  // Right Column - Flowchart
  let rightY = 35
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Asset Classification Flowchart', rightColumnX, rightY)
  rightY += 15
 
  // Main Asset Box
  const centerX = rightColumnX + columnWidth / 2
  const boxWidth = 50
  const boxHeight = 15
 
  doc.setFillColor(245, 245, 245)
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.rect(centerX - boxWidth/2, rightY, boxWidth, boxHeight, 'FD')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(asset.assetType, centerX - boxWidth/2 + 3, rightY + 8)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('Main Asset', centerX - boxWidth/2 + 3, rightY + 12)
 
  rightY += boxHeight + 8
 
  // Arrow Indicator (using a simple line-based arrow)
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(1)
  // Draw a simple arrow using lines
  doc.line(centerX - 3, rightY, centerX + 3, rightY) // horizontal line
  doc.line(centerX, rightY, centerX - 2, rightY + 3) // left diagonal
  doc.line(centerX, rightY, centerX + 2, rightY + 3) // right diagonal
  rightY += 8
 
  // Two Branches
  const leftX = rightColumnX + 10
  const rightX = rightColumnX + 50
  const branchWidth = 30
  const branchHeight = 12
 
  // Movable branch
  doc.setFillColor(240, 248, 255)
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.rect(leftX, rightY, branchWidth, branchHeight, 'FD')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Movable', leftX + 2, rightY + 6)
  doc.setFontSize(5)
  doc.setFont('helvetica', 'normal')
  doc.text(`${assetClassification.movable.length} items`, leftX + 2, rightY + 10)
 
  // Immovable branch
  doc.setFillColor(248, 255, 248)
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.rect(rightX, rightY, branchWidth, branchHeight, 'FD')
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('Immovable', rightX + 2, rightY + 6)
  doc.setFontSize(5)
  doc.setFont('helvetica', 'normal')
  doc.text(`${assetClassification.immovable.length} items`, rightX + 2, rightY + 10)
 
  rightY += branchHeight + 15
 
  // Components Table (Right Column)
  const allComponents = [
    ...assetClassification.movable.map(item => ({ ...item, type: 'Movable' })),
    ...assetClassification.immovable.map(item => ({ ...item, type: 'Immovable' }))
  ]
 
  const componentsTableData = allComponents.map((item, index) => [
    index + 1,
    `${item.type === 'Movable' ? '[M]' : '[I]'} ${item.assetName}`,
    item.tagId || 'No Tag ID',
    item.brand || 'N/A',
    item.model || 'N/A',
    item.capacity || 'N/A',
    item.location || 'N/A'
  ])
 
  autoTable(doc, {
    startY: rightY,
    head: [['#', 'Component Name', 'Tag ID', 'Brand', 'Model', 'Capacity', 'Location']],
    body: componentsTableData,
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header background
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      lineColor: [37, 99, 235], // Darker blue border
      lineWidth: 0.5
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [220, 220, 220],
      lineWidth: 0.3
    },
    margin: { left: rightColumnX, right: 15 },
    columnStyles: {
      0: { cellWidth: 6 },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 20, fontStyle: 'bold' },
      3: { cellWidth: 12 },
      4: { cellWidth: 12 },
      5: { cellWidth: 8 },
      6: { cellWidth: 12 }
    },
  })
 
  // Summary Section (Left Column - below Asset Overview)
  const summaryY = leftTableEndY + 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', leftColumnX, summaryY)
 
  const summaryData = [
    ['Movable', assetClassification.movable.length.toString()],
    ['Immovable', assetClassification.immovable.length.toString()],
    ['Total', (assetClassification.movable.length + assetClassification.immovable.length).toString()],
    ['Report Generated', new Date().toLocaleString()]
  ]
 
  autoTable(doc, {
    startY: summaryY + 8,
    head: [['Metric', 'Value']],
    body: summaryData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header background
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      lineColor: [37, 99, 235], // Darker blue border
      lineWidth: 0.5
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [220, 220, 220],
      lineWidth: 0.3
    },
    margin: { left: leftColumnX, right: 15 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 40 }
    },
  })
 
  // Simple Footer
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 10
 
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('EXOZEN Digital Asset Management System', 15, footerY)
  doc.text(`Report ID: ${asset.tagId}-${Date.now()}`, 150, footerY)
 
  // Save the PDF
  doc.save(`${asset.tagId}_${asset.assetType}_Classification_Report.pdf`)
}

/**
 * Generate comprehensive Asset History Card PDF
 */
export const generateHistoryCardPDF = async (asset: AssetData, subAsset?: ApiSubAsset) => {
  const doc = new jsPDF()
  let yPosition = 15
  const assetTagId = subAsset ? (subAsset.tagId || asset.tagId) : asset.tagId
  
  // Fetch maintenance logs
  const maintenanceLogs = await fetchMaintenanceLogsForAsset(assetTagId)
  
  // Header
  try {
    const logoUrl = '/exozen_logo1.png'
    doc.addImage(logoUrl, 'PNG', 15, 8, 30, 12)
  } catch {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('EXOZEN', 15, 18)
  }
  
  // Report Title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ASSET HISTORY CARD', 50, 12)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Asset ID: ${assetTagId}`, 50, 18)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 150, 12)
  
  // Header separator
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, 25, 195, 25)
  
  yPosition = 35
  
  // ============================================
  // SECTION 1: ASSET IDENTIFICATION DETAILS
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246)
  doc.text('1. ASSET IDENTIFICATION DETAILS', 15, yPosition)
  yPosition += 8
  
  doc.setTextColor(0, 0, 0)
  const assetInfo = subAsset ? [
    ['Asset Name / Description', subAsset.assetName || 'N/A'],
    ['Tag ID / Asset Number', subAsset.tagId || 'N/A'],
    ['Category', subAsset.category || 'N/A'],
    ['Parent Asset ID', asset.tagId || 'N/A'],
    ['Parent Asset Type', asset.assetType || 'N/A'],
    ['Brand / Make', subAsset.brand || 'N/A'],
    ['Model', subAsset.model || 'N/A'],
    ['Capacity / Rating', subAsset.capacity || 'N/A'],
    ['Location', `${asset.location?.building || 'N/A'}, ${asset.location?.floor || 'N/A'}, ${asset.location?.room || 'N/A'}`],
    ['Year of Installation', asset.yearOfInstallation || 'N/A'],
    ['Serial Number', asset.serialNumber || 'N/A']
  ] : [
    ['Asset ID / Tag Number', asset.tagId || 'N/A'],
    ['Asset Name / Description', `${asset.assetType}${asset.subcategory ? ` - ${asset.subcategory}` : ''}`],
    ['Category', asset.subcategory || asset.assetType || 'N/A'],
    ['Brand / Make', asset.brand || 'N/A'],
    ['Model', asset.model || 'N/A'],
    ['Serial Number', asset.serialNumber || 'N/A'],
    ['Capacity / Rating', asset.capacity || 'N/A'],
    ['Year of Installation', asset.yearOfInstallation || 'N/A'],
    ['Location', asset.location ? `${asset.location.building || 'N/A'}, Floor: ${asset.location.floor || 'N/A'}, Room: ${asset.location.room || 'N/A'}` : 'N/A'],
    ['Status', asset.status || 'Active'],
    ['Priority', asset.priority || 'Medium'],
    ['Project', asset.project?.projectName || 'N/A']
  ]
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Property', 'Value']],
    body: assetInfo,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 105 }
    },
  })
  
  yPosition = doc.lastAutoTable.finalY + 15
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // ============================================
  // SECTION 2: MAINTENANCE & SERVICE HISTORY
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94)
  doc.text('2. MAINTENANCE & SERVICE HISTORY', 15, yPosition)
  yPosition += 8
  
  if (maintenanceLogs.length > 0) {
    // Separate PM and Breakdown Maintenance
    const pmLogs = maintenanceLogs.filter((log: any) => 
      log.maintenanceType?.toLowerCase().includes('preventive') || 
      log.maintenanceType?.toLowerCase().includes('pm') ||
      log.maintenanceType?.toLowerCase().includes('scheduled')
    )
    const breakdownLogs = maintenanceLogs.filter((log: any) => 
      log.maintenanceType?.toLowerCase().includes('breakdown') || 
      log.maintenanceType?.toLowerCase().includes('corrective') ||
      log.maintenanceType?.toLowerCase().includes('repair')
    )
    
    // Preventive Maintenance Records
    if (pmLogs.length > 0) {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Preventive Maintenance (PM) Records', 15, yPosition)
      yPosition += 7
      
      const pmData = pmLogs.map((log: any, index: number) => [
        index + 1,
        new Date(log.date || log.scheduledDate || log.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        log.title || log.description?.substring(0, 30) || 'N/A',
        log.performedBy?.name || log.technicianName || 'N/A',
        log.status || 'N/A',
        log.remarks?.substring(0, 25) || 'N/A'
      ])
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Date', 'Tasks Performed', 'Technician', 'Status', 'Remarks']],
        body: pmData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 45 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 40 }
        },
      })
      
      yPosition = doc.lastAutoTable.finalY + 10
    }
    
    // Breakdown Maintenance Records
    if (breakdownLogs.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Breakdown / Corrective Maintenance Records', 15, yPosition)
      yPosition += 7
      
      const breakdownData = breakdownLogs.map((log: any, index: number) => {
        const breakdownDate = new Date(log.date || log.createdAt)
        const completedDate = log.workCompletedAt ? new Date(log.workCompletedAt) : null
        const downtime = completedDate ? Math.round((completedDate.getTime() - breakdownDate.getTime()) / (1000 * 60 * 60)) : 'N/A'
        
        return [
          index + 1,
          breakdownDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          log.description?.substring(0, 30) || log.title?.substring(0, 30) || 'N/A',
          log.actionTaken?.substring(0, 25) || 'N/A',
          log.performedBy?.name || log.technicianName || 'N/A',
          `${downtime}${typeof downtime === 'number' ? ' hrs' : ''}`,
          log.status || 'N/A'
        ]
      })
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Breakdown Date', 'Problem Description', 'Repair Action', 'Attended By', 'Downtime', 'Status']],
        body: breakdownData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        },
      })
      
      yPosition = doc.lastAutoTable.finalY + 10
    }
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('No maintenance records available for this asset.', 15, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // ============================================
  // SECTION 3: SPARE PARTS & MATERIAL USAGE
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(251, 146, 60)
  doc.text('3. SPARE PARTS & MATERIAL USAGE', 15, yPosition)
  yPosition += 8
  
  if (maintenanceLogs.length > 0) {
    const allPartsUsed: any[] = []
    maintenanceLogs.forEach((log: any) => {
      if (log.partsUsed && Array.isArray(log.partsUsed) && log.partsUsed.length > 0) {
        log.partsUsed.forEach((part: any) => {
          allPartsUsed.push({
            date: log.date || log.createdAt,
            partName: part.name || part.partName || 'N/A',
            quantity: part.quantity || 1,
            cost: part.cost || 0,
            maintenanceType: log.maintenanceType || 'N/A'
          })
        })
      }
    })
    
    if (allPartsUsed.length > 0) {
      const partsData = allPartsUsed.map((part: any, index: number) => [
        index + 1,
        new Date(part.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        part.partName,
        part.quantity.toString(),
        `₹${part.cost.toFixed(2)}`,
        part.maintenanceType
      ])
      
      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Date', 'Part Name', 'Quantity', 'Cost', 'Used In']],
        body: partsData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: [251, 146, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 25 },
          2: { cellWidth: 50 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 40 }
        },
      })
      
      yPosition = doc.lastAutoTable.finalY + 10
    } else {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(128, 128, 128)
      doc.text('No spare parts usage recorded.', 15, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 8
    }
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('No spare parts usage recorded.', 15, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // ============================================
  // SECTION 4: COMPLIANCE & DOCUMENTATION
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(139, 92, 246)
  doc.text('4. COMPLIANCE & DOCUMENTATION', 15, yPosition)
  yPosition += 8
  
  const assetFull = asset as any
  const compliance = assetFull.compliance
  const documents = assetFull.documents || []
  
  const complianceData: any[] = []
  
  if (compliance) {
    if (compliance.certifications && Array.isArray(compliance.certifications)) {
      compliance.certifications.forEach((cert: string, idx: number) => {
        complianceData.push([
          'Certification',
          cert,
          compliance.expiryDates && compliance.expiryDates[idx] ? compliance.expiryDates[idx] : 'N/A'
        ])
      })
    }
    if (compliance.regulatoryRequirements && Array.isArray(compliance.regulatoryRequirements)) {
      compliance.regulatoryRequirements.forEach((req: string) => {
        complianceData.push(['Regulatory Requirement', req, 'N/A'])
      })
    }
  }
  
  if (documents.length > 0) {
    documents.forEach((docItem: any) => {
      complianceData.push([
        docItem.type || 'Document',
        docItem.name || 'N/A',
        'Available'
      ])
    })
  }
  
  if (complianceData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Name / Description', 'Expiry / Status']],
      body: complianceData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [139, 92, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 80 },
        2: { cellWidth: 50 }
      },
    })
    
    yPosition = doc.lastAutoTable.finalY + 10
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('No compliance certificates or documents available.', 15, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // ============================================
  // SECTION 5: FINANCIAL & LIFECYCLE DATA
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(168, 85, 247)
  doc.text('5. FINANCIAL & LIFECYCLE DATA', 15, yPosition)
  yPosition += 8
  
  const financial = assetFull.financial || {}
  const financialData: any[] = []
  
  // Purchase Order Information
  if (financial.purchaseOrder) {
    const po = financial.purchaseOrder
    financialData.push(['Purchase Cost', `₹${po.purchaseCost || po.price || 0}`])
    financialData.push(['PO Number', po.poNumber || 'N/A'])
    financialData.push(['PO Date', po.poDate || po.purchaseDate || 'N/A'])
    financialData.push(['Vendor / Supplier', po.vendor || po.supplier || 'N/A'])
    financialData.push(['Invoice Number', po.invoiceNumber || 'N/A'])
    if (po.invoiceDate) financialData.push(['Invoice Date', po.invoiceDate])
  }
  
  // Financial Summary
  if (financial.totalCost) financialData.push(['Total Cost to Date', `₹${financial.totalCost}`])
  if (financial.currentValue) financialData.push(['Current Value', `₹${financial.currentValue}`])
  if (financial.depreciationRate) financialData.push(['Depreciation Rate', `${financial.depreciationRate}%`])
  
  // Replacement History
  if (financial.replacementHistory && Array.isArray(financial.replacementHistory) && financial.replacementHistory.length > 0) {
    financialData.push(['', '']) // Separator
    financialData.push(['REPLACEMENT HISTORY', ''])
    financial.replacementHistory.forEach((replacement: any, idx: number) => {
      financialData.push([`Replacement ${idx + 1} Date`, replacement.replacementDate || 'N/A'])
      financialData.push([`Replacement ${idx + 1} Reason`, replacement.replacementReason || 'N/A'])
      financialData.push([`Replacement ${idx + 1} Cost`, `₹${replacement.costOfReplacement || 0}`])
      if (replacement.replacedBy) financialData.push([`Replaced By`, replacement.replacedBy])
    })
  }
  
  // Lifecycle Status
  if (financial.lifecycle && Array.isArray(financial.lifecycle) && financial.lifecycle.length > 0) {
    financialData.push(['', '']) // Separator
    financialData.push(['LIFECYCLE STATUS', ''])
    financial.lifecycle.forEach((status: any) => {
      financialData.push([`${status.status}`, status.date || 'N/A'])
      if (status.notes) financialData.push([`Notes`, status.notes])
    })
  }
  
  if (financialData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: financialData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 105 }
      },
    })
    
    yPosition = doc.lastAutoTable.finalY + 10
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('No financial or lifecycle data available.', 15, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8
  }
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // ============================================
  // SECTION 6: SCAN HISTORY
  // ============================================
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(236, 72, 153)
  doc.text('6. SCAN HISTORY', 15, yPosition)
  yPosition += 8
  
  const scanHistory: ScanHistory[] = assetFull.scanHistory || []
  
  if (scanHistory.length > 0) {
    const historyData = scanHistory.map((entry: ScanHistory, index: number) => [
      index + 1,
      new Date(entry.scannedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      new Date(entry.scannedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      entry.scannedBy || 'Unknown',
      entry.scanType || 'N/A',
      entry.location ? `${entry.location.latitude}, ${entry.location.longitude}` : 'N/A',
      entry.notes || 'N/A'
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Date', 'Time', 'Scanned By', 'Scan Type', 'Location', 'Notes']],
      body: historyData,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [236, 72, 153],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 },
        6: { cellWidth: 40 }
      },
    })
  } else {
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(128, 128, 128)
    doc.text('No scan history available for this asset.', 15, yPosition)
    doc.setTextColor(0, 0, 0)
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 10
  
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text('EXOZEN Digital Asset Management System', 15, footerY)
  doc.text(`History Card ID: ${assetTagId}-${Date.now()}`, 150, footerY)
  
  // Save the PDF
  const fileName = subAsset 
    ? `${subAsset.tagId || asset.tagId}_Comprehensive_History_Card.pdf`
    : `${asset.tagId}_Comprehensive_History_Card.pdf`
  doc.save(fileName)
}

