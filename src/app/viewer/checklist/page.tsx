"use client"

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Image from 'next/image'

// Import extracted components
import ChecklistViewModal from '@/components/ui/checklist-view-modal'
import { ScannerModal } from '@/components/ui/scanner-modal-component'
import { SuccessToast } from '@/components/ui/success-toast'
import { ErrorDisplay } from '@/components/ui/error-display'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import CalendarChecklistModal from '@/components/ui/calendar-checklist-modal'

import { 
  Building2, 
  Package, 
  Calendar,
  QrCode,
  Eye,
  Download,
  X,
  Scan,
  CheckCircle,
  CheckSquare,
  MoreHorizontal
} from 'lucide-react'

import { Checklist, ChecklistItem, Location, CreatedBy } from '@/types/checklist'



export default function ViewerChecklists() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [filteredChecklists, setFilteredChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [authToken, setAuthToken] = useState('')
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRData, setSelectedQRData] = useState<{url: string, data: string, blobUrl?: string} | null>(null)
  const [qrImageLoading, setQrImageLoading] = useState(false)
  const [qrImageError, setQrImageError] = useState(false)
  
  // Checklist completion state
  const [checklistStatus, setChecklistStatus] = useState<Record<string, 'pending' | 'completed' | 'failed'>>({})
  // Store scanned results locally on this page (not in table rows)
  const [recentScans, setRecentScans] = useState<Checklist[]>([])
  // Inline sheet state
  const [inlinePeriod, setInlinePeriod] = useState<'daily'|'weekly'|'monthly'>('daily')
  const [inlineTicks, setInlineTicks] = useState<Record<string, Record<number, boolean>>>({})
  const [inlineNotes, setInlineNotes] = useState<Record<string, Record<number, string>>>({})
  const [inlineMonth, setInlineMonth] = useState<number>(new Date().getMonth())
  const [inlineYear, setInlineYear] = useState<number>(new Date().getFullYear())
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const [inlineCellSize, setInlineCellSize] = useState<number>(28)
  
  // Modal states
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState<{
    checklistId: string;
    title: string;
    type: string;
    location: Location | Record<string, unknown>;
    url: string;
  } | null>(null)
  
  // Enhanced modal states
  const [showChecklistViewModal, setShowChecklistViewModal] = useState(false)
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null)
  const [successChecklist, setSuccessChecklist] = useState<Checklist | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showScannerResponse, setShowScannerResponse] = useState(false)
  
  // Calendar modal states
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [calendarChecklist, setCalendarChecklist] = useState<Checklist | null>(null)



  // Define functions first before using them in useEffect
  const fetchChecklists = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = authToken || localStorage.getItem('authToken') || process.env.NEXT_PUBLIC_AUTH_TOKEN
      
      if (!token) {
        setError('Authentication token not found. Please enter your token below.')
        setShowTokenInput(true)
        setLoading(false)
        return
      }

      const response = await fetch('https://digitalasset.zenapi.co.in/api/checklists', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 401) {
        setError('Invalid authentication token. Please check your token and try again.')
        setShowTokenInput(true)
        setLoading(false)
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setChecklists(result.data)
        localStorage.setItem('authToken', token)
        setShowTokenInput(false)
      } else {
        setError('Failed to fetch checklists')
      }
    } catch {
      setError('Error connecting to server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [authToken])

  // Set filtered checklists to all checklists since we removed search
  useEffect(() => {
    setFilteredChecklists(checklists)
  }, [checklists])

  // Toggle checklist status (Yes/No functionality)
  const toggleChecklistStatus = (checklistId: string, status: 'completed' | 'failed') => {
    setChecklistStatus(prev => ({
      ...prev,
      [checklistId]: status
    }))
  }

  // Get current status for a checklist
  const getChecklistStatus = (checklistId: string) => {
    return checklistStatus[checklistId] || 'pending'
  }

  // Right-click add/edit note in a cell
  const handleCellRightClick = (itemId: string, day: number, e: React.MouseEvent) => {
    e.preventDefault()
    const current = inlineNotes[itemId]?.[day] || ''
    const value = window.prompt('Enter note/value for this cell', current)
    if (value !== null) {
      setInlineNotes(prev => ({
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          [day]: value
        }
      }))
    }
  }

  // Get checkbox status
  const getCheckboxStatus = (itemId: string, day: number) => {
    return inlineTicks[itemId]?.[day] || false
  }

  const getCellNote = (itemId: string, day: number) => {
    return inlineNotes[itemId]?.[day] || ''
  }

  const updateCellNote = (itemId: string, day: number, value: string) => {
    setInlineNotes(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [day]: value
      }
    }))
  }

  // Open calendar modal for checklist
  const openCalendarModal = (checklist: Checklist) => {
    setCalendarChecklist(checklist)
    setShowCalendarModal(true)
  }

  // Handle calendar modal save
  const handleCalendarSave = (data: any) => {
    console.log('Calendar data saved:', data)
    setToastMessage('Checklist progress saved successfully!')
    setShowSuccessToast(true)
  }

  // Handle calendar modal complete
  const handleCalendarComplete = (data: any) => {
    console.log('Calendar data completed:', data)
    setToastMessage('Checklist completed successfully!')
    setShowSuccessToast(true)
    setShowCalendarModal(false)
  }

  const closeQRModal = useCallback(() => {
    if (selectedQRData?.blobUrl) {
      URL.revokeObjectURL(selectedQRData.blobUrl)
    }
    setShowQRModal(false)
    setSelectedQRData(null)
    setQrImageLoading(false)
    setQrImageError(false)
  }, [selectedQRData?.blobUrl])

  useEffect(() => {
    fetchChecklists()
  }, [fetchChecklists])

  // helper: persist recent scans (page-level only)
  const saveRecentScan = (checklist: Checklist) => {
    setRecentScans(prev => {
      const next = [checklist, ...prev].slice(0, 20)
      try {
        localStorage.setItem('recentChecklistScans', JSON.stringify(next))
      } catch {}
      return next
    })
    // init ticks for inline grid
    const t: Record<string, Record<number, boolean>> = {}
    const n: Record<string, Record<number, string>> = {}
    checklist.items?.forEach((it, idx) => {
      const id = (it as any)._id || `item_${idx}`
      t[id] = {}
      n[id] = {}
    })
    setInlineTicks(t)
    setInlineNotes(n)
  }

  const getInlineDayLabels = (): string[] => {
    if (inlinePeriod === 'daily') return ['1']
    if (inlinePeriod === 'weekly') return ['1','2','3','4','5','6','7']
    const daysInMonth = new Date(inlineYear, inlineMonth + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1))
  }

  // Responsive cell size for mobile vs desktop
  useEffect(() => {
    const updateSize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024
      setInlineCellSize(width < 640 ? 20 : 24)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQRModal) {
        closeQRModal()
      }
    }

    if (showQRModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showQRModal, closeQRModal])








  const handleQRClick = (checklist: Checklist) => {
    setSelectedQRData({
      url: checklist.qrCode.url,
      data: checklist.qrCode.data
    })
    setShowQRModal(true)
    setQrImageLoading(true)
    setQrImageError(false)
    
    const testImageUrl = checklist.qrCode.url.startsWith('http') ? checklist.qrCode.url : `https://digitalasset.zenapi.co.in${checklist.qrCode.url}`
    
    fetch(testImageUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.blob()
    })
    .then(blob => {
      const imageUrl = URL.createObjectURL(blob)
      setSelectedQRData(prev => prev ? { ...prev, blobUrl: imageUrl } : null)
      setQrImageLoading(false)
    })
    .catch(() => {
      const testImg = new window.Image()
      testImg.crossOrigin = 'anonymous'
      testImg.onload = () => {
        setQrImageLoading(false)
      }
      testImg.onerror = () => {
        setQrImageLoading(false)
        setQrImageError(true)
      }
      testImg.src = testImageUrl
    })
  }

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeQRModal()
    }
  }

  // Enhanced handlers
  const showChecklistDetails = (checklist: Checklist) => {
    setSelectedChecklist(checklist)
    setShowChecklistViewModal(true)
  }

  const downloadChecklistInfo = (checklist: Checklist) => {
    try {
      const checklistInfo = `
Checklist Information
====================

Basic Details:
- Title: ${checklist.title}
- Description: ${checklist.description}
- Type: ${checklist.type}
- Frequency: ${checklist.frequency}
- Status: ${checklist.status}
- Priority: ${checklist.priority}
- Created By: ${checklist.createdBy.name} (${checklist.createdBy.email})

Location:
- Building: ${checklist.location.building}
- Floor: ${checklist.location.floor}
- Zone: ${checklist.location.zone}

Inspection Items: ${checklist.items.length}
${checklist.items.map((item, index) => `
${index + 1}. ${item.inspectionItem}
   Details: ${item.details}
   Status: ${item.status}
   Remarks: ${item.remarks}
`).join('')}

Tags: ${checklist.tags.join(', ')}

Timestamps:
- Created: ${new Date(checklist.createdAt).toLocaleString()}
- Updated: ${new Date(checklist.updatedAt).toLocaleString()}
      `.trim()

      const blob = new Blob([checklistInfo], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checklist_${checklist.title.replace(/[^a-zA-Z0-9]/g, '_')}_info.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToastMessage('Checklist information downloaded successfully!')
      setShowSuccessToast(true)
    } catch (error) {
      console.error('Error downloading checklist info:', error)
      setError('Failed to download checklist information')
    }
  }

  const downloadChecklistPDF = async (checklist: Checklist) => {
    try {
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF('landscape')

      const safe = (v: unknown) => (v === undefined || v === null ? '' : String(v))

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(`Checklist: ${safe(checklist.title)}`.slice(0, 120), 14, 16)

      // Meta row (single line summary akin to page header)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const meta = [
        `Type: ${safe(checklist.type)}`,
        `Frequency: ${safe(checklist.frequency)}`,
        `Priority: ${safe(checklist.priority)}`,
        `Status: ${safe(checklist.status)}`,
        `Period: ${inlinePeriod}`,
        `Month/Year: ${monthNames[inlineMonth]} ${inlineYear}`
      ].join('  |  ')
      doc.text(doc.splitTextToSize(meta, 280), 14, 24)

      // Table like the main page (#, Activity, dynamic day columns)
      const headers = ['#', 'Activity']
      const dayLabels = getInlineDayLabels()
      const allHeaders = headers.concat(dayLabels)

      // Layout
      const startX = 12
      let y = 34
      const rowH = 8
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const rightMargin = 12
      const bottomMargin = 14

      // Column widths: fixed for first two, remaining evenly share leftover
      const colW0 = 10 // #
      const colW1 = 60 // Activity
      const remainingW = pageW - rightMargin - startX - colW0 - colW1
      const dayColW = Math.max(10, Math.min(remainingW / dayLabels.length, 20))
      // If too many days to fit, split across vertical pages with header reprint

      const drawHeader = () => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        let x = startX
        // #
        doc.rect(x, y, colW0, rowH)
        doc.text('#', x + 2, y + 5)
        x += colW0
        // Activity
        doc.rect(x, y, colW1, rowH)
        doc.text('Activity', x + 2, y + 5)
        x += colW1
        // Days
        for (let i = 0; i < dayLabels.length; i += 1) {
          doc.rect(x, y, dayColW, rowH)
          const lbl = String(dayLabels[i])
          const textW = doc.getTextWidth(lbl)
          const tx = x + (dayColW - textW) / 2
          doc.text(lbl, tx, y + 5)
          x += dayColW
          if (x > pageW - rightMargin - dayColW / 2) break
        }
        y += rowH
        doc.setFont('helvetica', 'normal')
      }

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - bottomMargin) {
          doc.addPage('landscape')
          y = 20
          // Reprint title light on continuation pages
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.text(`Checklist: ${safe(checklist.title)}`.slice(0, 120), startX, y)
          y += 6
          drawHeader()
        }
      }

      // Initial header
      drawHeader()

      const items = checklist.items || []
      items.forEach((it, idx) => {
        ensureSpace(rowH)
        let x = startX
        // #
        doc.rect(x, y, colW0, rowH)
        doc.text(String(it.serialNumber || idx + 1), x + 2, y + 5)
        x += colW0
        // Activity
        doc.rect(x, y, colW1, rowH)
        const act = String(it.inspectionItem || '')
        const clipped = doc.splitTextToSize(act, colW1 - 2)
        doc.text(clipped[0] || '', x + 2, y + 5)
        x += colW1
        // Days with notes mirroring UI state (previously ticks)
        for (let i = 0; i < dayLabels.length; i += 1) {
          doc.rect(x, y, dayColW, rowH)
          const itemId = (it as any)._id || `item_${idx}`
          const note = (inlineNotes[itemId]?.[i] || '').toString()
          if (note) {
            const txt = doc.splitTextToSize(note, dayColW - 2)
            // show first line to keep row height stable
            doc.text(txt[0], x + 1, y + 5)
          }
          x += dayColW
          if (x > pageW - rightMargin - dayColW / 2) break
        }
        y += rowH
      })

      const filename = `checklist_${safe(checklist.title).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      doc.save(filename)
      setToastMessage('Checklist PDF downloaded successfully!')
      setShowSuccessToast(true)
    } catch (e) {
      console.error('Error generating checklist PDF:', e)
      setError('Failed to generate Checklist PDF')
    }
  }

  // Accept either an ID string or a full checklist object from the scanner
  const handleScannedResult = (payload: unknown) => {
    try {
      // Handle explicit mismatch notification
      if (payload && typeof payload === 'object' && (payload as any).__type === 'error') {
        setSuccessChecklist(null)
        setToastMessage('❌ Wrong checklist - not matching any provided checklist')
        setShowSuccessToast(true)
        return
      }
      // If we receive a full object, store it directly and exit (no GET)
      if (payload && typeof payload === 'object' && payload !== null && (payload as any)._id) {
        const full = payload as Checklist
        setSuccessChecklist(full)
        setScannedData({
          checklistId: full._id,
          title: full.title,
          type: full.type,
          location: full.location as Location | Record<string, unknown>,
          url: full.qrCode?.url || ''
        })
        saveRecentScan(full)
        // Close scanner and show inline sheet UI instead of popup
        setShowScanner(false)
        return
      }

      const checklistId = String(payload || '')
      // First try to find by exact ID match
      let foundChecklist = checklists.find(checklist => 
        checklist._id === checklistId
      )
      
      // If not found by exact ID, try to find by QR code data
      if (!foundChecklist) {
        foundChecklist = checklists.find(checklist => 
          checklist.qrCode?.data?.includes(checklistId) ||
          checklist.qrCode?.data === checklistId
        )
      }
      
      // If still not found, try to find by title or description
      if (!foundChecklist) {
        foundChecklist = checklists.find(checklist => 
          checklist.title.toLowerCase().includes(checklistId.toLowerCase()) ||
          checklist.description.toLowerCase().includes(checklistId.toLowerCase())
        )
      }
      
      if (foundChecklist) {
        console.log('Found checklist in handleScannedResult:', foundChecklist)
        setSuccessChecklist(foundChecklist)
        setToastMessage(`✅ Checklist found: ${foundChecklist.title}`)
        setShowSuccessToast(true)
        
        // Also set scanned data for display
        setScannedData({
          checklistId: foundChecklist._id,
          title: foundChecklist.title,
          type: foundChecklist.type,
          location: foundChecklist.location as Location | Record<string, unknown>,
          url: foundChecklist.qrCode?.url || ''
        })
        saveRecentScan(foundChecklist)
        // Close scanner and show inline grid
        setShowScanner(false)
      } else {
        // No match -> clear inline grid and show wrong checklist message
        setSuccessChecklist(null)
        setToastMessage('❌ Wrong checklist - not matching any provided checklist')
        setShowSuccessToast(true)
        // Keep scanner open to try again
        setShowScanner(true)
      }
    } catch (error) {
      console.error('Error processing scanned result:', error)
      setToastMessage(`❌ Error processing scan: ${error}`)
      setShowSuccessToast(true)
    }
  }







  if (loading) {
    return <LoadingSpinner text="Loading checklists..." />
  }

  if (error && showTokenInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                Authentication Required
              </h3>
              <p className="text-gray-600 mb-6 text-lg font-medium">{error}</p>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your Bearer token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full"
                />
                <div className="flex space-x-2">
                  <Button onClick={fetchChecklists} className="flex-1">
                    Connect
                  </Button>
                  <Button variant="outline" onClick={() => setShowTokenInput(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} onClearError={() => setError(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/** Precompute day labels for consistent grid templates */}
          {(() => null)()}
          {/* Recent Scans (local) panel intentionally removed from UI */}
          {/* QR Scanner Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    QR Code Scanner
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Scan QR codes to view and manage checklists
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6"
              >
                <Scan className="w-5 h-5" />
                Scan QR Code
              </Button>
            </div>
          </div>

          {/* Inline Sheet - visible when a scan exists */}
          {successChecklist && (
            <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{successChecklist.title}</h3>
                <div className="flex items-center gap-2">
                <Button
                  onClick={() => downloadChecklistPDF(successChecklist)}
                  variant="outline"
                  className="h-9 px-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <select
                  value={inlinePeriod}
                  onChange={(e) => setInlinePeriod(e.target.value as 'daily'|'weekly'|'monthly')}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                  <select
                    value={inlineMonth}
                    onChange={(e) => setInlineMonth(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label="Select month"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={inlineYear}
                    onChange={(e) => setInlineYear(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    aria-label="Select year"
                  >
                    {Array.from({length: 7}, (_,i) => new Date().getFullYear() - 3 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                    </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-400 border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-1.5 py-1 text-left border border-gray-400">#</th>
                      <th className="px-1.5 py-1 text-left border border-gray-400">Activity</th>
                      <th className="px-1.5 py-1 text-left border border-gray-400">
                        {(() => {
                          const inlineDayLabels = getInlineDayLabels()
                          return (
                            <div
                              className="grid overflow-x-auto pr-2"
                              style={{ gridTemplateColumns: `repeat(${inlineDayLabels.length}, minmax(${inlineCellSize}px, 1fr))` }}
                            >
                              {inlineDayLabels.map((lbl, idx) => (
                                <div key={idx} className="flex items-center justify-center border border-gray-400 bg-white">
                                  <span className="text-center text-xs font-semibold text-gray-700">
                                    {lbl}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </th>
                  </tr>
                </thead>
                  <tbody>
                    {successChecklist.items?.map((it, idx) => {
                      const itemId = (it as any)._id || `item_${idx}`
                      return (
                        <tr key={itemId}>
                          <td className="px-1.5 py-1 border border-gray-400">{it.serialNumber || idx + 1}</td>
                          <td className="px-1.5 py-1 border border-gray-400">
                            <div className="font-medium">{it.inspectionItem}</div>
                          </td>
                          <td className="px-1.5 py-1 border border-gray-400">
                            {(() => {
                              const inlineDayLabels = getInlineDayLabels()
                              return (
                                <div
                                  className="grid overflow-x-auto pr-2"
                                  style={{ gridTemplateColumns: `repeat(${inlineDayLabels.length}, minmax(${inlineCellSize}px, 1fr))` }}
                                >
                                  {inlineDayLabels.map((_, i) => {
                                    const note = getCellNote(itemId, i)
                                    return (
                                      <div
                                        key={i}
                                        className="flex items-center justify-center border border-gray-400 bg-white relative p-0"
                                        style={{ height: inlineCellSize * 1.5, minHeight: 42 }}
                                      >
                                        <input
                                          type="text"
                                          value={note}
                                          onChange={(e) => updateCellNote(itemId, i, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              ;(e.target as HTMLInputElement).blur()
                                            }
                                          }}
                                          className="w-full h-full px-1 text-xs text-gray-800 focus:outline-none"
                                          placeholder=""
                                        />
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
              </table>
            </div>
            </div>
          )}

          {/* Checklist table removed per request */}
        </div>
      </div>

      {/* Enhanced Modals */}
      {showChecklistViewModal && selectedChecklist && (
        <ChecklistViewModal
          isOpen={showChecklistViewModal}
          onClose={() => {
                    setShowChecklistViewModal(false)
                    setSelectedChecklist(null)
                  }}
          checklist={selectedChecklist}
        />
      )}

      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanResult={handleScannedResult}
        scannedResult={scannedData ? `Found: ${scannedData.title}` : null}
        checklists={checklists.map(checklist => ({
          _id: checklist._id,
          title: checklist.title,
          description: checklist.description,
          qrCode: checklist.qrCode,
          location: checklist.location,
          type: checklist.type,
          status: checklist.status,
          priority: checklist.priority,
          frequency: checklist.frequency,
          items: checklist.items
        }))}
        mode="checklists"
        strictChecklistsOnly={true}
      />



      {/* QR Code Modal */}
      {showQRModal && selectedQRData && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border-2 border-blue-200 dark:border-blue-700">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 px-6 py-4 border-b border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    QR Code Scanner
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeQRModal}
                  className="h-10 w-10 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg">
                  {qrImageLoading && (
                    <div className="w-64 h-64 mx-auto flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                  
                  <Image 
                    src={selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `https://digitalasset.zenapi.co.in${selectedQRData.url}`)}
                    alt="QR Code"
                    width={256}
                    height={256}
                    className={`mx-auto object-contain rounded-lg ${
                      qrImageLoading ? 'hidden' : ''
                    }`}
                    style={{ display: qrImageLoading ? 'none' : 'block' }}
                  />
                  
                  {qrImageError && (
                    <div className="w-64 h-64 mx-auto flex flex-col items-center justify-center text-red-500">
                      <QrCode className="h-16 w-16 mb-3 opacity-50" />
                      <p className="text-lg font-medium">QR Code not found</p>
                      <p className="text-sm text-gray-500 mt-1">Please try again</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      const imageUrl = selectedQRData.blobUrl || (selectedQRData.url.startsWith('http') ? selectedQRData.url : `https://digitalasset.zenapi.co.in${selectedQRData.url}`);
                      link.href = imageUrl;
                      link.download = 'checklist-qr.png';
                      link.click();
                    }}
                    variant="outline"
                    size="lg"
                    className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800 shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={qrImageError}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </div>


            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end gap-3">
                <Button onClick={closeQRModal} variant="outline" size="lg" className="h-11 px-6">
                  Close
                </Button>
                  <Button 
                  onClick={() => {
                    closeQRModal()
                    setShowScanner(true)
                  }} 
                    size="lg" 
                  className="h-11 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                  <Scan className="h-5 w-5 mr-2" />
                  Start Scanning
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Calendar Checklist Modal */}
      <CalendarChecklistModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        checklist={calendarChecklist}
        onSave={handleCalendarSave}
        onComplete={handleCalendarComplete}
      />

      {/* Success Toast */}
      {showSuccessToast && (
      <SuccessToast
        message={toastMessage}
        onClose={() => setShowSuccessToast(false)}
      />
      )}
    </div>
  )
}
