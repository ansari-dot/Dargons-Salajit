import React, { useEffect, useState } from 'react';
import { useToast } from '../../components/common/Toast';
import {
  AdminCalculatorCurrency,
  calculatorAdminApi,
} from '../../services/calculatorAdmin.api';

export const CalculatorCurrencySettingsPage: React.FC = () => {
  const toast = useToast();
  const [currencies, setCurrencies] = useState<AdminCalculatorCurrency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const loadCurrencies = async () => {
    setIsLoading(true);
    try {
      setCurrencies(await calculatorAdminApi.getCalculatorCurrencies());
    } catch (error) {
      toast.error(`Failed to load currency settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const updateCurrency = (
    code: string,
    patch: Partial<AdminCalculatorCurrency>
  ) => {
    setCurrencies((current) => current.map((currency) => (
      currency.code === code ? { ...currency, ...patch } : currency
    )));
  };

  const saveCurrency = async (currency: AdminCalculatorCurrency) => {
    setSavingCode(currency.code);
    try {
      await calculatorAdminApi.updateCalculatorCurrency(currency.code, {
        is_enabled: currency.isEnabled,
        rate_mode: currency.rateMode === 'manual' ? 'manual' : 'automatic',
        manual_rate_pkr_per_unit: currency.rateMode === 'manual'
          ? Number(currency.manualRatePkrPerUnit)
          : null,
      });
      toast.success(`${currency.code} settings saved.`);
      await loadCurrencies();
    } catch (error) {
      toast.error(`Failed to save ${currency.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingCode(null);
    }
  };

  if (isLoading) {
    return <p className="pp-placeholder">Loading calculator currencies...</p>;
  }

  return (
    <div className="pp-card">
      <div className="pp-info">
        <span className="pp-info__icon">i</span>
        Exchange rates are shown as PKR per one currency unit. Automatic rates use the exchange-rate service; manual rates override it for calculator estimates only.
      </div>
      <div className="pp-table-wrap">
        <table className="pp-table">
          <thead>
            <tr>
              <th>Currency</th>
              <th>Enabled</th>
              <th>Rate Source</th>
              <th>PKR per Unit</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => {
              const isBase = currency.code === 'PKR';
              const isManual = currency.rateMode === 'manual';
              const updatedAt = currency.rateUpdatedAt
                ? new Date(currency.rateUpdatedAt).toLocaleString()
                : 'Not available';

              return (
                <tr key={currency.code}>
                  <td><strong>{currency.code}</strong> — {currency.name}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={currency.isEnabled}
                      disabled={isBase}
                      onChange={(event) => updateCurrency(currency.code, { isEnabled: event.target.checked })}
                      aria-label={`${currency.code} enabled`}
                    />
                  </td>
                  <td>
                    {isBase ? 'Base currency' : (
                      <select
                        value={currency.rateMode}
                        onChange={(event) => updateCurrency(currency.code, {
                          rateMode: event.target.value as 'automatic' | 'manual',
                        })}
                        aria-label={`${currency.code} rate source`}
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual override</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {isManual ? (
                      <input
                        className="pp-input pp-weight-input"
                        type="number"
                        min="0.000001"
                        step="0.000001"
                        value={currency.manualRatePkrPerUnit ?? ''}
                        onChange={(event) => updateCurrency(currency.code, {
                          manualRatePkrPerUnit: event.target.value === '' ? null : Number(event.target.value),
                        })}
                        aria-label={`${currency.code} manual PKR rate`}
                      />
                    ) : Number(currency.ratePkrPerUnit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td>{currency.rateSource} · {updatedAt}</td>
                  <td>
                    <button
                      type="button"
                      className="pp-pill pp-pill--ghost pp-pill--sm"
                      disabled={savingCode === currency.code}
                      onClick={() => saveCurrency(currency)}
                    >
                      {savingCode === currency.code ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
