import { X } from 'lucide-react'

interface SuccessNotificationProps {
  show: boolean
  message: string
  onClose: () => void
}

export const SuccessNotification = ({ show, message, onClose }: SuccessNotificationProps) => {
  if (!show) return null

  return (
    <div className="mb-4 px-4">
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

