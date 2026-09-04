import React, { useState } from 'react';
import { BookOpen, CheckCircle2, Search, ArrowLeft } from 'lucide-react';

export default function StealthCloak({ onUncloak }) {
  const [activeTab, setActiveTab] = useState('notes');
  const [userNotes, setUserNotes] = useState(
    '1. Enthalpy (ΔH): Heat content of a system at constant pressure.\n2. Entropy (ΔS): Measure of randomness or molecular disorder.\n3. Gibbs Free Energy (ΔG = ΔH - TΔS): Spontaneous when ΔG < 0.\n4. Ideal Gas Law: PV = nRT (R = 0.0821 L·atm/(mol·K)).'
  );

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-800 font-sans overflow-y-auto select-text">
      {/* Top Academic Document Navbar */}
      <header className="border-b border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 text-white rounded">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              AP Science & Mathematics — Reference Document & Lab Notes
            </h1>
            <p className="text-xs text-slate-500">Document ID: SCI-2026-REF • Updated 2 hrs ago</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search reference notes..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md outline-none w-52"
            />
          </div>

          <button
            onClick={onUncloak}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Resume Game (or press Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Games (Esc)</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6 flex gap-4 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 border-b-2 transition ${
            activeTab === 'notes' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          General Study Notes
        </button>
        <button
          onClick={() => setActiveTab('equations')}
          className={`py-2.5 border-b-2 transition ${
            activeTab === 'equations' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Key Formulas & Constants
        </button>
        <button
          onClick={() => setActiveTab('periodic')}
          className={`py-2.5 border-b-2 transition ${
            activeTab === 'periodic' ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          Periodic Table Trends
        </button>
      </div>

      {/* Document Content */}
      <main className="max-w-4xl mx-auto p-8">
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Unit 5: Chemical Kinetics & Equilibrium</h3>
                <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                  Reaction rate is proportional to the collision frequency of reacting molecules with activation energy (Ea) exceeding the reaction threshold.
                </p>
              </div>
            </div>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-2">1. Fundamental Thermodynamic Laws</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                The First Law states that total energy in an isolated system is conserved (ΔU = Q - W). The Second Law dictates that the entropy of an isolated system always increases over time in any spontaneous physical or chemical process.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Standard Enthalpy</h4>
                  <p className="font-mono text-sm font-semibold text-slate-900">ΔH°rxn = Σ ΔH°f(products) - Σ ΔH°f(reactants)</p>
                  <p className="text-xs text-slate-500 mt-2">Endothermic if ΔH &gt; 0, Exothermic if ΔH &lt; 0.</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Gibbs Free Energy</h4>
                  <p className="font-mono text-sm font-semibold text-slate-900">ΔG° = ΔH° - TΔS°</p>
                  <p className="text-xs text-slate-500 mt-2">Spontaneous when ΔG° is negative at constant temperature T.</p>
                </div>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-900">Personal Lecture Scratchpad</h2>
                <span className="text-xs text-slate-400">Auto-saved</span>
              </div>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={6}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-blue-500 text-slate-700"
              />
            </section>
          </div>
        )}

        {activeTab === 'equations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Standard Chemistry & Physics Reference Values</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-semibold">Constant Name</th>
                    <th className="p-3 font-semibold">Symbol</th>
                    <th className="p-3 font-semibold">Standard Value & Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-medium">Speed of Light in Vacuum</td>
                    <td className="p-3 font-mono">c</td>
                    <td className="p-3 font-mono">2.998 × 10⁸ m/s</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Planck's Constant</td>
                    <td className="p-3 font-mono">h</td>
                    <td className="p-3 font-mono">6.626 × 10⁻³⁴ J·s</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Avogadro's Number</td>
                    <td className="p-3 font-mono">N_A</td>
                    <td className="p-3 font-mono">6.022 × 10²³ mol⁻¹</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Universal Gas Constant</td>
                    <td className="p-3 font-mono">R</td>
                    <td className="p-3 font-mono">8.314 J/(mol·K) = 0.08206 L·atm/(mol·K)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'periodic' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Periodic Table General Periodic Trends</h2>
            <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
              <li><strong className="text-slate-800">Atomic Radius:</strong> Decreases across a period (left to right) due to increasing effective nuclear charge; increases down a group.</li>
              <li><strong className="text-slate-800">Ionization Energy:</strong> Increases across a period; decreases down a group.</li>
              <li><strong className="text-slate-800">Electronegativity:</strong> Fluorine (F) is the most electronegative element (Pauling scale 4.0); noble gases typically excluded.</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
