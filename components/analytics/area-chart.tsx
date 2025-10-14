"use client"

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { useTheme } from 'next-themes'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface AreaChartData {
  name: string
  value: number
}

interface AreaChartProps {
  data: AreaChartData[]
  color?: string
  height?: number
}

export function AnalyticsAreaChart({ data, color = "#8884d8", height = 300 }: AreaChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: {
        show: false
      },
      background: 'transparent'
    },
    colors: [color],
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      strokeDashArray: 3
    },
    xaxis: {
      categories: data.map(item => item.name),
      labels: {
        style: {
          colors: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light'
    }
  }

  const series = [{
    name: 'Value',
    data: data.map(item => item.value)
  }]

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={height}
    />
  )
}