import React, { useState } from 'react';
import { X, BookOpen, Award, Layers, Sparkles, Binary } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'th' | 'en'>('th');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold font-cinzel text-neutral-100 truncate">
                {lang === 'th' ? 'กติกาป๊อกเด้ง & คู่มือ' : 'Pokdeng Rules'}
              </h2>
              <p className="text-[10px] sm:text-xs text-neutral-400 hidden sm:block truncate">
                {lang === 'th' ? 'คู่มือกฎป๊อกเด้งไทยและหลัก Functional Programming' : 'Thai Card Game & Software Architecture'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="bg-neutral-800 p-0.5 rounded-lg border border-neutral-700 flex text-xs">
              <button
                onClick={() => setLang('th')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-medium transition cursor-pointer ${
                  lang === 'th' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                ไทย
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-medium transition cursor-pointer ${
                  lang === 'en' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                EN
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {lang === 'th' ? (
            <>
              {/* Thai Guide */}
              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  1. การนับแต้มไพ่ (Card Values & Score)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                  <li><strong>ไพ่ 2 - 9:</strong> มีแต้มตามหน้าไพ่</li>
                  <li><strong>ไพ่ 10, J, Q, K:</strong> มีค่าเป็น <strong>0</strong> แต้ม</li>
                  <li><strong>ไพ่ A:</strong> มีค่าเป็น <strong>1</strong> แต้ม</li>
                  <li>
                    <strong>แต้มรวม:</strong> นำแต้มไพ่ทุกใบมารวมกันแล้ว <strong>หารเอาเศษด้วย 10</strong> (Modulo 10) เช่น 7 + 8 = 15 &rarr; 5 แต้ม
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  2. ลำดับความใหญ่ของมือไพ่ (Hand Rankings)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-red-500/30">
                    <div className="font-bold text-red-400 text-sm">⚡ ป๊อก 9 / ป๊อก 8 (Pok 9 / Pok 8)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      ไพ่ 2 ใบแรกได้ 9 หรือ 8 แต้ม <strong>เกมจะจบและเปิดไพ่ทันที</strong> ไม่มีการจั่วใบที่ 3
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-emerald-500/30">
                    <div className="font-bold text-emerald-400 text-sm">👑 ตอง (Tong / Three of a Kind)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      ไพ่ 3 ใบมีค่าหน้าไพ่เดียวกันทั้งหมด (เช่น K-K-K หรือ 7-7-7) ชนะมือธรรมดาทั้งหมด จ่ายตัวคูณสูง
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-amber-500/30">
                    <div className="font-bold text-amber-400 text-sm">🃏 สามเหลือง (Sam Lueang)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      ไพ่ 3 ใบเป็นไพ่ฝรั่ง (J, Q, K) คละกันทั้ง 3 ใบ อันดับสูงกว่ามือธรรมดา
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-700">
                    <div className="font-bold text-neutral-200 text-sm">🎲 แต้มธรรมดา (0 - 9 แต้ม)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      วัดกันด้วยแต้มรวมมอดุโล 10 ผู้ใดแต้มมากกว่าเป็นฝ่ายชนะ
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  3. กฎตัวคูณเด้ง (Deng Multipliers)
                </h3>
                <div className="space-y-2 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800 text-xs">
                  <p>
                    <strong className="text-amber-300">2 เด้ง (x2):</strong> ไพ่ 2 ใบมีดอกเดียวกัน (เช่น ♥♥) หรือมีแต้มเดียวกัน (เช่น 4-4) ผู้ชนะจะได้รับเงินรางวัล 2 เท่า!
                  </p>
                  <p>
                    <strong className="text-cyan-300">3 เด้ง (x3):</strong> ไพ่ 3 ใบมีดอกเดียวกันทั้งหมด (เช่น ♠♠♠) ผู้ชนะจะได้รับเงินรางวัล 3 เท่า!
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Binary className="w-4 h-4" />
                  4. สถาปัตยกรรม Functional Programming (FP)
                </h3>
                <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs space-y-2 text-neutral-300">
                  <p>
                    <strong>Functional Core, Imperative Shell:</strong> โค้ดเกมนี้แบ่งออกเป็นแกนกลาง Pure Functions 100% ที่ไม่แปรผันข้อมูลเดิม (No In-Place Mutation) และใช้ <code>readonly</code> ป้องกันบั๊ก
                  </p>
                  <p>
                    <strong>Time-Travel Friendly:</strong> ทุกๆ แอ็กชันสร้าง <code>GameState</code> สำเนาใหม่ทั้งหมด ทำให้สามารถกดย้อนดูประวัติกระดานเดิมได้ตลอดเวลา
                  </p>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* English Guide */}
              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  1. Card Values & Scoring
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-1">
                  <li><strong>Cards 2 - 9:</strong> Worth their face value.</li>
                  <li><strong>Cards 10, J, Q, K:</strong> Worth <strong>0</strong> points.</li>
                  <li><strong>Ace (A):</strong> Worth <strong>1</strong> point.</li>
                  <li>
                    <strong>Total Score:</strong> The sum of all card values modulo 10 (0-9 points). For example, 7 + 8 = 15 &rarr; 5 points.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  2. Hand Categories & Rank
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-red-500/30">
                    <div className="font-bold text-red-400 text-sm">⚡ Pok 9 / Pok 8</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Initial 2 cards equal 9 or 8 points. Ends the round immediately without further draws.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-emerald-500/30">
                    <div className="font-bold text-emerald-400 text-sm">👑 Tong (Three of a Kind)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      All 3 cards have matching face values (e.g. K-K-K or 7-7-7). Outranks normal hands.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-amber-500/30">
                    <div className="font-bold text-amber-400 text-sm">🃏 Sam Lueang (3 Face Cards)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Any 3 court face cards (J, Q, K). Outranks standard point hands.
                    </p>
                  </div>
                  <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-700">
                    <div className="font-bold text-neutral-200 text-sm">🎲 Normal (0 - 9 Points)</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Standard point comparison modulo 10. Higher score wins.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  3. Deng Multipliers
                </h3>
                <div className="space-y-2 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800 text-xs">
                  <p>
                    <strong className="text-amber-300">2 Deng (x2):</strong> 2 cards with matching suits (e.g. ♥♥) or matching face values (e.g. 4-4). Multiplies payout by 2x!
                  </p>
                  <p>
                    <strong className="text-cyan-300">3 Deng (x3):</strong> 3 cards of the identical suit (e.g. ♠♠♠). Multiplies payout by 3x!
                  </p>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
