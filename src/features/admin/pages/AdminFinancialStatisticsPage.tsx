import { useState, useEffect, useCallback, useMemo } from 'react'
import { agentService } from '../../agents/services/agentService'
import { transferService } from '../../transfers/services/transferService'
import { cityService } from '../../cities/services/cityService'
import type { Agent, Transfer } from '../../../types/index'
import { UserRole } from '../../../types/index'
import { formatCurrency } from '../../../shared/utils/formatCurrency'
import {
  type DateRange,
  type FinancialIndicators,
  type CityStats,
  type AgentPerformance,
  filterTransfersByDateRange,
  calculateFinancialIndicators,
  calculateCityStats,
  calculateAgentPerformance,
  getTopAgents,
  getTodayRange,
  getLast7DaysRange,
  getLast30DaysRange,
  getAllTimeRange,
} from '../../admin/utils/financialStats'
import './AdminFinancialStatisticsPage.css'

type PeriodPreset = 'today' | '7days' | '30days' | 'all'

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 derniers jours' },
  { value: '30days', label: '30 derniers jours' },
  { value: 'all', label: 'Tout' },
]

export default function AdminFinancialStatisticsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [cities, setCities] = useState<Agent['city'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)

  const presetRange = useMemo<DateRange>(() => {
    if (periodPreset === 'today') {
      return getTodayRange()
    }
    if (periodPreset === '7days') {
      return getLast7DaysRange()
    }
    if (periodPreset === '30days') {
      return getLast30DaysRange()
    }
    return getAllTimeRange()
  }, [periodPreset])

  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    setStartDate(presetRange.startDate)
    setEndDate(presetRange.endDate)
    setDateError(null)
  }, [presetRange])

  useEffect(() => {
    if (!startDate || !endDate) {
      setDateError(null)
      return
    }

    if (startDate > endDate) {
      setDateError('La date de début doit être antérieure ou égale à la date de fin.')
    } else {
      setDateError(null)
    }
  }, [startDate, endDate])
  /* oxlint-enable react/set-state-in-effect */

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [agentsData, transfersData, citiesData] = await Promise.all([
        agentService.getAll(),
        transferService.getAll(),
        cityService.getAll(),
      ])
      setAgents(agentsData.filter((a) => a.role === UserRole.AGENT))
      setTransfers(transfersData)
      setCities(citiesData.map((c) => c.name))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les statistiques financières.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const validatedDateRange = useMemo<DateRange | null>(() => {
    if (!startDate || !endDate) {
      return null
    }

    if (startDate > endDate) {
      return null
    }

    return { startDate, endDate }
  }, [startDate, endDate])

  const filteredTransfers = useMemo(() => {
    if (!validatedDateRange) return []
    return filterTransfersByDateRange(transfers, validatedDateRange)
  }, [transfers, validatedDateRange])

  const indicators = useMemo<FinancialIndicators>(() => {
    return calculateFinancialIndicators(filteredTransfers)
  }, [filteredTransfers])

  const cityStats = useMemo<CityStats[]>(() => {
    return calculateCityStats(filteredTransfers, cities)
  }, [filteredTransfers, cities])

  const agentPerformances = useMemo<AgentPerformance[]>(() => {
    return calculateAgentPerformance(agents, filteredTransfers)
  }, [agents, filteredTransfers])

  const topAgents = useMemo<AgentPerformance[]>(() => {
    return getTopAgents(agentPerformances, 5)
  }, [agentPerformances])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  if (loading) {
    return (
      <div className="admin-financial-page">
        <div className="admin-financial-loading">
          <div className="admin-loading-spinner" />
          <p>Chargement des statistiques financières...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-financial-page">
        <div className="admin-financial-error">
          <p>{error}</p>
          <button onClick={loadData} className="admin-retry-button">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-financial-page">
      <div className="admin-financial-header">
        <div>
          <h1>Statistiques financières</h1>
          <p className="admin-financial-subtitle">
            Analyse des transferts et des performances financières
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="admin-refresh-button"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="admin-financial-filters">
        <div className="admin-financial-presets">
          {PERIOD_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setPeriodPreset(preset.value)}
              className={`admin-financial-preset-button ${periodPreset === preset.value ? 'active' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="admin-financial-date-inputs">
          <div className="admin-financial-date-field">
            <label htmlFor="startDate">Date de début</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-financial-date-input"
            />
          </div>
          <div className="admin-financial-date-field">
            <label htmlFor="endDate">Date de fin</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="admin-financial-date-input"
            />
          </div>
        </div>

        {dateError && (
          <div className="admin-financial-date-error">
            <p>{dateError}</p>
          </div>
        )}
      </div>

      {filteredTransfers.length === 0 && !dateError && (
        <div className="admin-financial-empty">
          <p>Aucun transfert disponible pour la période sélectionnée.</p>
        </div>
      )}

      {filteredTransfers.length > 0 && (
        <>
          <section className="admin-financial-section">
            <h2>Indicateurs financiers</h2>
            <div className="admin-financial-stats-grid">
              <div className="admin-financial-stat-card">
                <span className="admin-financial-stat-value">{formatCurrency(indicators.totalVolume)}</span>
                <span className="admin-financial-stat-label">Volume total transféré</span>
              </div>
              <div className="admin-financial-stat-card">
                <span className="admin-financial-stat-value">{formatCurrency(indicators.paidAmount)}</span>
                <span className="admin-financial-stat-label">Montant payé</span>
              </div>
              <div className="admin-financial-stat-card">
                <span className="admin-financial-stat-value">{formatCurrency(indicators.pendingAmount)}</span>
                <span className="admin-financial-stat-label">Montant en attente</span>
              </div>
              <div className="admin-financial-stat-card">
                <span className="admin-financial-stat-value">{formatCurrency(indicators.feesGenerated)}</span>
                <span className="admin-financial-stat-label">Frais générés</span>
              </div>
            </div>
          </section>

          <section className="admin-financial-section">
            <h2>Statistiques par ville</h2>
            <div className="admin-financial-table-container">
              <table className="admin-financial-table">
                <thead>
                  <tr>
                    <th>Ville</th>
                    <th>Transferts</th>
                    <th>Volume</th>
                    <th>Payé</th>
                    <th>En attente</th>
                    <th>Frais</th>
                  </tr>
                </thead>
                <tbody>
                  {cityStats.map((stat) => (
                    <tr key={stat.city}>
                      <td className="admin-financial-table-city">{stat.city}</td>
                      <td>{stat.totalTransfers}</td>
                      <td>{formatCurrency(stat.volume)}</td>
                      <td>{formatCurrency(stat.paidAmount)}</td>
                      <td>{formatCurrency(stat.pendingAmount)}</td>
                      <td>{formatCurrency(stat.feesGenerated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-financial-section">
            <h2>Top agents</h2>
            {topAgents.length === 0 ? (
              <div className="admin-financial-empty">
                <p>Aucun agent à afficher pour le classement.</p>
              </div>
            ) : (
              <div className="admin-financial-top-agents">
                {topAgents.map((perf, index) => (
                  <div key={perf.agent.id} className="admin-financial-top-agent-card">
                    <div className="admin-financial-top-agent-rank">#{index + 1}</div>
                    <div className="admin-financial-top-agent-info">
                      <span className="admin-financial-top-agent-name">
                        {perf.agent.firstName} {perf.agent.lastName}
                      </span>
                      <span className="admin-financial-top-agent-city">{perf.agent.city}</span>
                    </div>
                    <div className="admin-financial-top-agent-stats">
                      <div className="admin-financial-top-agent-stat">
                        <span className="admin-financial-top-agent-stat-value">{perf.activityScore}</span>
                        <span className="admin-financial-top-agent-stat-label">Activité</span>
                      </div>
                      <div className="admin-financial-top-agent-stat">
                        <span className="admin-financial-top-agent-stat-value">{perf.paymentsMade}</span>
                        <span className="admin-financial-top-agent-stat-label">Paiements</span>
                      </div>
                      <div className="admin-financial-top-agent-stat">
                        <span className="admin-financial-top-agent-stat-value">{formatCurrency(perf.amountPaid)}</span>
                        <span className="admin-financial-top-agent-stat-label">Montant payé</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
