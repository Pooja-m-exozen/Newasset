// "use client"

// import React, { useState } from 'react'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
// import { Button } from './button'
// import { Badge } from './badge'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
// import { 
//   TrendingUp, 
//   TrendingDown, 
//   Activity,
//   BarChart3,
//   LineChart,
//   PieChart,
//   AreaChart,
//   ScatterChart,
//   RefreshCw,
//   Download,
//   Filter,
//   Settings,
//   Eye,
//   EyeOff,
//   Calendar,
//   Clock,
//   Target,
//   Zap,
//   Brain,
//   Gauge,
//   Thermometer,
//   AlertTriangle,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react'

// interface AdvancedAnalyticsChartProps {
//   data: any
//   isLoading: boolean
//   error: string | null
//   onRefresh: () => void
//   onExport: () => void
//   title?: string
//   description?: string
// }

// export function AdvancedAnalyticsChart({
//   data,
//   isLoading,
//   error,
//   onRefresh,
//   onExport,
//   title = "Advanced Analytics",
//   description = "Comprehensive performance metrics and trends"
// }: AdvancedAnalyticsChartProps) {
//   const [selectedChartType, setSelectedChartType] = useState('line')
//   const [selectedTimeRange, setSelectedTimeRange] = useState('30_days')
//   const [selectedMetric, setSelectedMetric] = useState('all')
//   const [showLegend, setShowLegend] = useState(true)

//   // Sample chart data - replace with real data from props
//   const chartData = {
//     efficiency: [85, 87, 89, 88, 92, 90, 93, 91, 89, 94, 96, 95],
//     utilization: [78, 80, 82, 81, 85, 83, 86, 84, 82, 87, 89, 88],
//     costs: [125000, 118000, 122000, 115000, 110000, 108000, 105000, 102000, 98000, 95000, 92000, 90000],
//     health: [92, 94, 91, 93, 95, 96, 94, 95, 97, 98, 96, 97]
//   }

//   const timeLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

//   const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
//     switch (trend) {
//       case 'up':
//         return <TrendingUp className="h-4 w-4 text-green-600" />
//       case 'down':
//         return <TrendingDown className="h-4 w-4 text-red-600" />
//       case 'stable':
//         return <Activity className="h-4 w-4 text-gray-600" />
//     }
//   }

//   const getMetricColor = (metric: string) => {
//     switch (metric) {
//       case 'efficiency': return 'text-blue-600'
//       case 'utilization': return 'text-green-600'
//       case 'costs': return 'text-red-600'
//       case 'health': return 'text-purple-600'
//       default: return 'text-gray-600'
//     }
//   }

//   const getMetricIcon = (metric: string) => {
//     switch (metric) {
//       case 'efficiency': return Gauge
//       case 'utilization': return Target
//       case 'costs': return TrendingDown
//       case 'health': return Thermometer
//       default: return Activity
//     }
//   }

//   const renderChart = () => {
//     switch (selectedChartType) {
//       case 'line':
//         return (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
//               <div className="flex items-center space-x-2">
//                 {showLegend && (
//                   <div className="flex items-center space-x-4 text-sm">
//                     <div className="flex items-center space-x-1">
//                       <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
//                       <span>Efficiency</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                       <span>Utilization</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                       <span>Costs</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
//                       <span>Health</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//             <div className="h-64 bg-gray-50 rounded-lg p-4">
//               <div className="h-full flex items-end justify-between space-x-1">
//                 {chartData.efficiency.map((value, index) => (
//                   <div key={index} className="flex flex-col items-center space-y-2">
//                     <div className="w-8 bg-blue-500 rounded-t" style={{ height: `${value}%` }}></div>
//                     <span className="text-xs text-gray-500">{timeLabels[index]}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )
//       case 'bar':
//         return (
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-900">Performance Comparison</h3>
//             <div className="h-64 bg-gray-50 rounded-lg p-4">
//               <div className="h-full flex items-end justify-between space-x-4">
//                 <div className="flex flex-col items-center space-y-2">
//                   <div className="w-12 bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
//                   <span className="text-xs text-gray-500">Efficiency</span>
//                 </div>
//                 <div className="flex flex-col items-center space-y-2">
//                   <div className="w-12 bg-green-500 rounded-t" style={{ height: '78%' }}></div>
//                   <span className="text-xs text-gray-500">Utilization</span>
//                 </div>
//                 <div className="flex flex-col items-center space-y-2">
//                   <div className="w-12 bg-red-500 rounded-t" style={{ height: '92%' }}></div>
//                   <span className="text-xs text-gray-500">Costs</span>
//                 </div>
//                 <div className="flex flex-col items-center space-y-2">
//                   <div className="w-12 bg-purple-500 rounded-t" style={{ height: '96%' }}></div>
//                   <span className="text-xs text-gray-500">Health</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )
//       case 'area':
//         return (
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-900">Cumulative Performance</h3>
//             <div className="h-64 bg-gray-50 rounded-lg p-4">
//               <div className="h-full flex items-end justify-between space-x-1">
//                 {chartData.efficiency.map((value, index) => (
//                   <div key={index} className="flex flex-col items-center space-y-2">
//                     <div className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t" style={{ height: `${value}%` }}></div>
//                     <span className="text-xs text-gray-500">{timeLabels[index]}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )
//       default:
//         return (
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
//             <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
//               <div className="text-center">
//                 <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
//                 <p className="text-gray-500">Select a chart type to view data</p>
//               </div>
//             </div>
//           </div>
//         )
//     }
//   }

//   if (isLoading) {
//     return (
//       <Card className="shadow-lg border-0">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center">
//                 <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
//                 {title}
//               </CardTitle>
//               <CardDescription>{description}</CardDescription>
//             </div>
//             <Button variant="outline" size="sm" disabled>
//               <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
//               Loading...
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center justify-center py-8">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   if (error) {
//     return (
//       <Card className="shadow-lg border-0">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <div>
//               <CardTitle className="flex items-center">
//                 <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
//                 {title}
//               </CardTitle>
//               <CardDescription>{description}</CardDescription>
//             </div>
//             <Button variant="outline" size="sm" onClick={onRefresh}>
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Retry
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center justify-center py-8">
//             <div className="text-center">
//               <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load analytics data</h3>
//               <p className="text-gray-600 mb-4">{error}</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <Card className="shadow-lg border-0">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="flex items-center">
//               <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
//               {title}
//             </CardTitle>
//             <CardDescription>{description}</CardDescription>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button variant="outline" size="sm" onClick={() => setShowLegend(!showLegend)}>
//               {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//             </Button>
//             <Button variant="outline" size="sm" onClick={onExport}>
//               <Download className="w-4 h-4" />
//             </Button>
//             <Button variant="outline" size="sm" onClick={onRefresh}>
//               <RefreshCw className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-6">
//           {/* Chart Controls */}
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <Select value={selectedChartType} onValueChange={setSelectedChartType}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="line">Line Chart</SelectItem>
//                   <SelectItem value="bar">Bar Chart</SelectItem>
//                   <SelectItem value="area">Area Chart</SelectItem>
//                   <SelectItem value="pie">Pie Chart</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="7_days">7 Days</SelectItem>
//                   <SelectItem value="30_days">30 Days</SelectItem>
//                   <SelectItem value="90_days">90 Days</SelectItem>
//                   <SelectItem value="1_year">1 Year</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={selectedMetric} onValueChange={setSelectedMetric}>
//                 <SelectTrigger className="w-32">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Metrics</SelectItem>
//                   <SelectItem value="efficiency">Efficiency</SelectItem>
//                   <SelectItem value="utilization">Utilization</SelectItem>
//                   <SelectItem value="costs">Costs</SelectItem>
//                   <SelectItem value="health">Health</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Metrics Summary */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {Object.entries(chartData).map(([metric, values]) => {
//               const Icon = getMetricIcon(metric)
//               const currentValue = values[values.length - 1]
//               const previousValue = values[values.length - 2]
//               const trend = currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : 'stable'
//               const change = Math.abs(currentValue - previousValue)
              
//               return (
//                 <div key={metric} className="p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center justify-between mb-2">
//                     <Icon className={`w-5 h-5 ${getMetricColor(metric)}`} />
//                     {getTrendIcon(trend)}
//                   </div>
//                   <p className="text-2xl font-bold text-gray-900">{currentValue}</p>
//                   <p className="text-sm text-gray-600 capitalize">{metric}</p>
//                   <p className="text-xs text-gray-500">
//                     {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{change} from last period
//                   </p>
//                 </div>
//               )
//             })}
//           </div>

//           {/* Chart */}
//           {renderChart()}

//           {/* Insights */}
//           <div className="bg-blue-50 rounded-lg p-4">
//             <div className="flex items-center space-x-2 mb-2">
//               <Brain className="w-5 h-5 text-blue-600" />
//               <h4 className="font-semibold text-blue-900">AI Insights</h4>
//             </div>
//             <p className="text-sm text-blue-800">
//               Performance is trending upward with a 12% improvement in efficiency over the last quarter. 
//               Cost optimization measures have resulted in a 15% reduction in maintenance expenses.
//             </p>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// } 