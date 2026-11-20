import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import { ConcreteCategoryId } from '../types/game';
import { CATEGORIES } from '../engine/categories';

interface ReferenceModalProps {
  onClose: () => void;
}

const TABS: ConcreteCategoryId[] = [
  'multiples',
  'powers',
  'squares-roots',
  'traps',
];

export const ReferenceModal: React.FC<ReferenceModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<ConcreteCategoryId>('multiples');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpen size={20} />
            <h2>LGS Hızlı Refleks Kartı</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="ref-tabs">
          {TABS.map((id) => (
            <button
              key={id}
              className={`ref-tab ${tab === id ? 'ref-tab--active' : ''}`}
              style={
                tab === id
                  ? {
                      backgroundColor: CATEGORIES[id].accentSoft,
                      color: CATEGORIES[id].accent,
                      borderColor: CATEGORIES[id].accentBorder,
                    }
                  : undefined
              }
              onClick={() => setTab(id)}
            >
              {CATEGORIES[id].shortTitle}
            </button>
          ))}
        </div>

        <div className="ref-body">
          {tab === 'multiples' && (
            <div className="ref-grid-single">
              {[
                { b: 12, m: '24, 36, 48, 60, 72, 84, 96, 108, 120, 144' },
                { b: 15, m: '30, 45, 60, 75, 90, 105, 120, 135, 150, 180' },
                { b: 16, m: '32, 48, 64, 80, 96, 112, 128, 144, 160' },
                { b: 18, m: '36, 54, 72, 90, 108, 126, 144, 162, 180' },
                { b: 24, m: '48, 72, 96, 120, 144, 168, 192, 216, 240' },
                { b: 36, m: '72, 108, 144, 180, 216, 252, 288, 324, 360' },
              ].map((row) => (
                <div key={row.b} className="ref-row">
                  <span className="ref-key">{row.b}</span>
                  <span className="ref-val">{row.m}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'powers' && (
            <div className="ref-columns">
              <div className="ref-col">
                <h3>2’nin Kuvvetleri</h3>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((e) => (
                  <div key={e} className="ref-pair">
                    <span>
                      2<sup>{e}</sup>
                    </span>
                    <strong>{2 ** e}</strong>
                  </div>
                ))}
              </div>
              <div className="ref-col">
                <h3>3’ün Kuvvetleri</h3>
                {[1, 2, 3, 4, 5, 6].map((e) => (
                  <div key={e} className="ref-pair">
                    <span>
                      3<sup>{e}</sup>
                    </span>
                    <strong>{3 ** e}</strong>
                  </div>
                ))}
                <h3 style={{ marginTop: '14px' }}>5’in Kuvvetleri</h3>
                {[1, 2, 3, 4, 5].map((e) => (
                  <div key={e} className="ref-pair">
                    <span>
                      5<sup>{e}</sup>
                    </span>
                    <strong>{5 ** e}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'squares-roots' && (
            <div className="ref-columns">
              <div className="ref-col">
                <h3>11–25 Tam Kareler</h3>
                <div className="ref-mini-grid">
                  {Array.from({ length: 15 }, (_, i) => i + 11).map((n) => (
                    <div key={n} className="ref-pair">
                      <span>
                        {n}
                        <sup>2</sup>
                      </span>
                      <strong>{n * n}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ref-col">
                <h3>Klasik a√b Kökleri</h3>
                <div className="ref-mini-grid">
                  {[
                    ['√12', '2√3'],
                    ['√18', '3√2'],
                    ['√20', '2√5'],
                    ['√27', '3√3'],
                    ['√32', '4√2'],
                    ['√45', '3√5'],
                    ['√48', '4√3'],
                    ['√50', '5√2'],
                    ['√72', '6√2'],
                    ['√75', '5√3'],
                    ['√80', '4√5'],
                    ['√98', '7√2'],
                    ['√108', '6√3'],
                    ['√125', '5√5'],
                    ['√128', '8√2'],
                    ['√147', '7√3'],
                    ['√162', '9√2'],
                    ['√180', '6√5'],
                    ['√200', '10√2'],
                  ].map(([k, v]) => (
                    <div key={k} className="ref-pair">
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'traps' && (
            <div className="ref-traps-grid">
              {[
                ['51', '3 × 17'],
                ['57', '3 × 19'],
                ['69', '3 × 23'],
                ['87', '3 × 29'],
                ['91', '7 × 13'],
                ['93', '3 × 31'],
                ['111', '3 × 37'],
                ['119', '7 × 17'],
                ['121', '11 × 11'],
                ['133', '7 × 19'],
                ['143', '11 × 13'],
                ['161', '7 × 23'],
                ['169', '13 × 13'],
                ['187', '11 × 17'],
                ['203', '7 × 29'],
                ['209', '11 × 19'],
                ['221', '13 × 17'],
                ['247', '13 × 19'],
              ].map(([n, f]) => (
                <div key={n} className="ref-trap-chip">
                  <span className="ref-trap-num">{n}</span>
                  <span className="ref-trap-fac">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
