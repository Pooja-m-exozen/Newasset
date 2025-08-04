# QR Code Generator for Digital Assets

This module provides a comprehensive QR code generation system for digital assets with a modern, user-friendly interface.

## Features

- **QR Code Generation**: Generate QR codes for any digital asset using the asset ID
- **Customizable Options**: Set QR code size and include/exclude URL
- **Authentication**: Secure API access with authentication tokens
- **Download Functionality**: Download generated QR codes as PNG files
- **Copy URL**: Copy QR code URLs to clipboard
- **Asset Information Display**: View detailed asset information including location, status, and priority
- **Modern UI**: Clean, responsive design with proper error handling and success notifications

## API Integration

The system integrates with the following API endpoint:

```
POST /api/digital-assets/qr/{assetId}
```

### Request Body
```json
{
  "size": 300,
  "includeUrl": true
}
```

### Response
```json
{
  "success": true,
  "message": "QR Code generated successfully",
  "qrCode": {
    "url": "/uploads/digital-assets/qr_ASSET555_1754283221243.png",
    "shortUrl": "/api/digital-assets/qr/ASSET555",
    "data": {
      "tagId": "ASSET555",
      "assetType": "testttt",
      "subcategory": "DELL",
      "brand": "DD",
      "model": "D",
      "status": "active",
      "priority": "high",
      "location": {
        "latitude": "70.34",
        "longitude": "23.45",
        "floor": "sss",
        "room": "sss",
        "building": "errr"
      },
      "assignedTo": "",
      "projectName": "Exozen pvt ltdd",
      "url": "undefined/api/assets/scan/ASSET555",
      "timestamp": "2025-08-04T04:53:41.201Z",
      "checksum": "a4a387871f40242c"
    }
  }
}
```

## Components

### QRCodeGenerator
Main component for QR code generation with the following features:
- Asset ID input
- QR code size configuration (100-1000px)
- Include/exclude URL option
- Real-time generation with loading states
- Error handling and success notifications
- Asset information display
- Download and copy functionality

### AuthTokenInput
Authentication component for setting API access tokens:
- Secure token input (password field)
- Token validation
- Clear token functionality
- Visual feedback for token status

### SuccessToast
Notification component for success messages:
- Auto-dismissing toasts
- Customizable duration
- Manual close option
- Modern styling

## Usage

1. **Set Authentication Token**: Use the AuthTokenInput component to set your API access token
2. **Enter Asset ID**: Input the asset ID for which you want to generate a QR code
3. **Configure Options**: Set the QR code size and URL inclusion preferences
4. **Generate**: Click the "Generate QR Code" button
5. **Download/Copy**: Use the provided buttons to download the QR code or copy its URL

## File Structure

```
src/
├── app/admin/digital-assets/generate/
│   └── page.tsx                    # Main QR generation page
├── components/ui/
│   ├── qr-code-generator.tsx       # Main QR generator component
│   ├── auth-token-input.tsx        # Authentication input component
│   ├── success-toast.tsx           # Success notification component
│   └── loading-spinner.tsx         # Loading spinner component
├── lib/
│   └── DigitalAssets.ts            # API functions and types
└── contexts/
    └── DigitalAssets.ts            # React context for state management
```

## API Functions

### generateQRCode(assetId, options)
Generates a QR code for the specified asset ID.

**Parameters:**
- `assetId` (string): The asset ID to generate QR code for
- `options` (object): Configuration options
  - `size` (number): QR code size in pixels (default: 300)
  - `includeUrl` (boolean): Whether to include URL in QR code (default: true)

**Returns:** Promise<QRCodeGenerationResponse>

### downloadQRCode(qrCodeUrl, filename)
Downloads the generated QR code image.

**Parameters:**
- `qrCodeUrl` (string): The URL of the QR code image
- `filename` (string): The filename for the downloaded file

**Returns:** Promise<void>

## Authentication

The system uses Bearer token authentication. The token is stored in localStorage and automatically included in API requests.

## Error Handling

- Network errors are caught and displayed to the user
- Authentication errors are handled gracefully
- Input validation prevents invalid requests
- Loading states provide user feedback during operations

## Styling

The components use Tailwind CSS for styling and are fully responsive. The design follows modern UI/UX principles with:
- Clean, minimalist design
- Proper spacing and typography
- Consistent color scheme
- Responsive layout
- Accessible form controls

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires clipboard API for copy functionality
- Local storage for token persistence 