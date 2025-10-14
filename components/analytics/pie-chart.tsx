"use client"

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { useTheme } from 'next-themes'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface PieChartData {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  height?: number
}

export function AnalyticsPieChart({ data, height = 300 }: PieChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const options: ApexOptions = {
    chart: {
      type: 'pie',
      background: 'transparent'
    },
    colors: data.map(item => item.color),
    labels: data.map(item => item.name),
    legend: {
      position: 'bottom',
      labels: {
        colors: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (value) => `${value}`
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
      style: {
        colors: [isDark ? '#ffffff' : '#000000']
      }
    }
  }

  const series = data.map(item => item.value)

  return (
    <Chart
      options={options}
      series={series}
      type="pie"
      height={height}
    />
  )
}