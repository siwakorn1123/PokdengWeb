# คู่มืออธิบายการเขียนโปรแกรม Pokdeng (TypeScript) ด้วยหลัก Functional Programming (FP)

เอกสารฉบับนี้อธิบายแนวคิด โครงสร้างโค้ด หน้าที่ของแต่ละฟังก์ชัน และสถาปัตยกรรมที่ใช้ในการออกแบบเกม Pokdeng ในไฟล์ [pokdengp.ts](file:///d:/work/Codex/pokdeng/pokdengp.ts) ตามหลักสูตรวิทยาการคอมพิวเตอร์ (Computer Science Paradigm)

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture Paradigm)

เราใช้รูปแบบสถาปัตยกรรม **"Functional Core, Imperative Shell"** (แกนกลางบริสุทธิ์ เปลือกนอกจัดการระบบ) ในการออกแบบ:

1.  **Functional Core (แกนกลางบริสุทธิ์)**: บรรจุประเภทข้อมูล (Types) และฟังก์ชันคำนวณกฎเกณฑ์ทั้งหมด (คำนวณแต้ม, ตรวจป๊อก, คำนวณผู้ชนะ, จัดการจังหวะเกม) ส่วนนี้ประกอบด้วย **Pure Functions 100%** ไม่มีผลกระทบภายนอก (No Side Effects) และเป็น Deterministic (เข้าอะไร ได้ผลเดิมเสมอ) ง่ายต่อการทดสอบ (Unit Testing)
2.  **Imperative Shell (เปลือกนอกควบคุม)**: ทำหน้าที่เชื่อมต่อกับโลกภายนอก (Side Effects) เช่น การสุ่มลำดับไพ่ (Randomness) และการรอรับข้อมูลอินพุตจากแป้นพิมพ์ (Console I/O) ส่วนนี้จะทำหน้าที่ป้อนข้อมูลสุ่มหรืออินพุตจากผู้ใช้งานเข้าสู่ Core เพื่อคำนวณ แล้วนำข้อมูลผลลัพธ์ใหม่กลับมาแสดงผล

---

## 2. ทำไมถึงใช้ Type/Interface แทน Class? (Data Modeling)

ในหลักการของ FP เราต้องการแยก **"ข้อมูล (Data)"** ออกจาก **"พฤติกรรม (Behavior/Functions)"** อย่างเด็ดขาด ซึ่งแตกต่างจาก OOP (Object-Oriented Programming) ที่นำข้อมูลและเมธอดมารวมอยู่ด้วยกันใน Class

*   **OOP**: นิยมใช้ Class เก็บตัวแปรภายใน (State) และอัปเดตค่าผ่านคำสั่งอย่าง `this.score = calculation()` (มีการกลายพันธุ์ของข้อมูล - Mutability)
*   **FP**: ใช้ `interface` และ `type` ในฐานะโครงสร้างข้อมูลคงที่ (Data Structures) ที่มีคุณสมบัติ `readonly` ป้องกันการเขียนทับโดยไม่ได้ตั้งใจที่ระดับคอมไพเลอร์ ข้อมูลจะถูกส่งเข้าไปในฟังก์ชันแยกต่างหาก และฟังก์ชันจะคืนค่าออกมาเป็นข้อมูลชุดใหม่เสมอ

---

## 3. เจาะลึกโค้ดทีละบรรทัดและฟังก์ชัน (Code & Function Explanation)

### ส่วนที่ 1: การกำหนดประเภทข้อมูล (Data Types)

```typescript
export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type FaceValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
```
*   **คำอธิบาย**: เป็นการกำหนด **Union Types** (หรือ String Literal Types) เพื่อจำกัดชุดข้อมูลดอกไพ่และมูลค่าหน้าไพ่ ช่วยตรวจสอบความถูกต้องตั้งแต่เขียนโค้ด ป้องกันการป้อนค่าผิดพลาด เช่น `'Heart'` (ไม่มีตัว s)

```typescript
export interface Card {
  readonly suit: Suit;
  readonly value: FaceValue;
}
```
*   **คำอธิบาย**: โครงสร้างของไพ่แต่ละใบ ใช้คำสั่ง `readonly` บังคับให้โครงสร้างนี้ไม่สามารถถูกแก้ไขได้หลังจากสร้างขึ้นมาแล้ว

```typescript
export interface Hand {
  readonly cards: readonly Card[];
}
```
*   **คำอธิบาย**: มือของผู้เล่นที่ถือไพ่ โดยใช้ `readonly Card[]` ซึ่งใน TypeScript จะเป็นการห้ามใช้งานเมธอดที่ทำให้ข้อมูลใน Array เดิมเกิดการกลายพันธุ์ เช่น `.push()`, `.pop()`, `.sort()`, หรือ `.splice()`

```typescript
export interface Player {
  readonly name: string;
  readonly hand: Hand;
  readonly isDealer: boolean;
}
```
*   **คำอธิบาย**: โครงสร้างผู้เล่น ประกอบด้วยชื่อ, มือไพ่ปัจจุบัน, และสถานะว่าเป็นเจ้ามือ (Dealer) หรือไม่

```typescript
export type GamePhase = 'Dealing' | 'PlayerTurn' | 'DealerTurn' | 'Showdown';
```
*   **คำอธิบาย**: สถานะของระบบ (Finite State Machine - FSM) ควบคุมจังหวะของเกม

```typescript
export interface GameState {
  readonly deck: readonly Card[];
  readonly player: Player;
  readonly dealer: Player;
  readonly phase: GamePhase;
  readonly winner?: string;
  readonly reason?: string;
}
```
*   **คำอธิบาย**: **Single Source of Truth** ของระบบเกม เก็บข้อมูลทุกอย่างที่ต้องใช้ในการเล่น ณ ขณะนั้นเอาไว้ในอ็อบเจกต์เดียว ทำให้การส่งต่อสถานะไปให้ฟังก์ชันต่างๆ สะดวกและตรวจสอบได้ง่าย

```typescript
export type HandCategory =
  | { readonly type: 'Pok9' }
  | { readonly type: 'Pok8' }
  | { readonly type: 'Tong'; readonly value: FaceValue }
  | { readonly type: 'SamLueang' }
  | { readonly type: 'Normal'; readonly score: number };
```
*   **คำอธิบาย**: เป็นการใช้ **Discriminated Union** (หรือในทฤษฎี FP เรียกว่า *Algebraic Data Type - ADT*) เพื่อจำแนกประเภทความใหญ่ของมือไพ่ ทำให้สามารถใช้ระบบประเภทของ TypeScript ช่วยตรวจสอบเงื่อนไขที่สมบูรณ์ได้

---

### ส่วนที่ 2: ฟังก์ชันคำนวณกฎเกณฑ์ (Pure Core Logic)

#### `getCardValue`
```typescript
export const getCardValue = (card: Card): number => {
  switch (card.value) {
    case 'A': return 1;
    case '10':
    case 'J':
    case 'Q':
    case 'K': return 0;
    default: return parseInt(card.value, 10);
  }
};
```
*   **การทำงาน**: คำนวณหาแต้มของไพ่แต่ละใบ (10, J, Q, K ได้ 0 แต้ม, A ได้ 1 แต้ม, เลขอื่นตามแต้มหน้าไพ่)
*   **ความบริสุทธิ์ (Purity)**: เป็น Pure Function เพราะรับ `Card` และคำนวณแต้มกลับมาอย่างคงเส้นคงวา ไม่มีผลกระทบอื่นใดภายนอก

#### `calculateScore`
```typescript
export const calculateScore = (hand: Hand): number => {
  const sum = hand.cards.reduce((acc, card) => acc + getCardValue(card), 0);
  return sum % 10;
};
```
*   **การทำงาน**: คำนวณแต้มรวมของไพ่ในมือ (นำแต้มไพ่ทั้งหมดมารวมกันแล้วหารเอาเศษด้วย 10)
*   **แนวคิด FP**: ใช้ **`reduce`** ซึ่งเป็นฟังก์ชันระดับสูง (Higher-Order Function) เพื่อยุบข้อมูลใน Array ให้เหลือแต้มรวมเพียงค่าเดียว แทนการใช้ลูป `for` แบบเดิมที่ต้องคอยอัปเดตตัวแปรผลรวม (Mutable Variable)

#### `isPok`
```typescript
export const isPok = (hand: Hand): boolean => {
  if (hand.cards.length !== 2) return false;
  const score = calculateScore(hand);
  return score === 8 || score === 9;
};
```
*   **การทำงาน**: ตรวจสอบว่าเป็นแต้ม "ป๊อก" หรือไม่ โดยเช็กว่าต้องมีไพ่ 2 ใบแรก และมีแต้มเท่ากับ 8 หรือ 9 เท่านั้น

#### `getHandCategory`
*   **การทำงาน**: ประเมินและจำแนกมือไพ่ว่าเป็นกลุ่มประเภทใด (เช่น ป๊อก 9, ป๊อก 8, ตอง, สามเหลือง, หรือธรรมดา)
*   **แนวคิด FP**: เป็นการจัดระเบียบโครงสร้างเงื่อนไขในลักษณะของ Pattern Matching โดยไม่ใช้ Nested If-Else ที่ซ้อนกันหลายชั้นจนซับซ้อน

#### `calculateDeng`
```typescript
export const calculateDeng = (hand: Hand): DengMultiplier => {
  const cards = hand.cards;
  if (cards.length === 2) {
    const [c1, c2] = cards;
    if (c1.suit === c2.suit || c1.value === c2.value) {
      return 2;
    }
  } else if (cards.length === 3) {
    const [c1, c2, c3] = cards;
    if (c1.suit === c2.suit && c2.suit === c3.suit) {
      return 3;
    }
  }
  return 1;
};
```
*   **การทำงาน**: ตรวจสอบคอมโบเด็ง (เด็ง 2 หรือเด็ง 3)
*   **แนวคิด FP**: ใช้ **Array Pattern Matching (Destructuring)** ดึงการอ้างอิงไพ่ `[c1, c2]` หรือ `[c1, c2, c3]` มาเช็กเงื่อนไขได้ทันทีโดยไม่ต้องเข้าถึงอินเด็กซ์ตรงๆ ทำให้โค้ดอ่านง่ายและประกาศค่าชัดเจน

#### `compareHands`
*   **การทำงาน**: เปรียบเทียบมือไพ่สองมือเพื่อหาผู้ชนะ (ให้คะแนนตามระดับความใหญ่ประเภทมือ หากคะแนนมือเสมอกันให้เปรียบเทียบแต้มดิบ 0-9)

#### `createDeck`
```typescript
export const createDeck = (): readonly Card[] => {
  const suits: readonly Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values: readonly FaceValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  return suits.flatMap(suit =>
    values.map(value => ({ suit, value }))
  );
};
```
*   **การทำงาน**: สร้างสำรับไพ่ 52 ใบ
*   **แนวคิด FP**: หลีกเลี่ยงการใช้ลูปสองชั้นที่ทำงานทีละรอบแล้วคอยอัปเดตตัวแปรภายนอก หันมาใช้การทำ **`flatMap`** และ **`map`** ซึ่งเป็นคำสั่งเชิงประกาศ (Declarative) แสดงเจตนารมณ์ว่าต้องการผสานชุดข้อมูลเพื่อแปลงร่างให้ออกมาเป็นอาร์เรย์ของไพ่ในครั้งเดียว

#### `initializeGame`
*   **การทำงาน**: รับสำรับไพ่ที่สุ่มมาแล้ว แจกไพ่สลับลำดับทีละใบให้ผู้เล่นและเจ้ามือจนครบคนละ 2 ใบ หากคนใดคนหนึ่งป๊อก จะนำทางส่งสถานะเข้าสู่กระบวนการตัดสินผู้ชนะ (Showdown) ทันที
*   **แนวคิด FP**: ฟังก์ชันรับข้อมูล และ **Copy** ข้อมูลออกไปเป็นสถานะใหม่ (`GameState`) ที่ส่งคืนกลับไปให้ส่วนควบคุม (Shell) ใช้งานต่อ

#### `drawPlayerCard` / `stayPlayer`
*   **การทำงาน**: คำนวณสถานะใหม่เมื่อผู้เล่นต้องการจั่วไพ่เพิ่มใบที่ 3 หรืออยู่เฉยๆ
*   **แนวคิด FP**: มีการสลายอาร์เรย์เดิมและกระจายโครงสร้างใหม่ด้วย **Spread Operator (`...`)** เช่น `cards: [...state.player.hand.cards, nextCard]` เพื่อให้แน่ใจว่าไม่มีการเขียนทับอาร์เรย์เดิมในอดีต (Immutability)

#### `dealerAutomatedTurn`
*   **การทำงาน**: รันกฎ AI ของเจ้ามือ (ถ้าแต้มเจ้ามือน้อยกว่า 5 แต้ม จะจั่วใบที่ 3 เสมอ ถ้าเท่ากับหรือมากกว่า 5 จะไม่จั่ว) แล้วผลักสถานะเข้าสู่ขั้นตอนตัดสินผลลัพธ์ (`determineWinner`)

#### `determineWinner`
*   **การทำงาน**: ทำหน้าที่เทียบไพ่ขั้นสุดท้ายและอัปเดตสถานะเกมว่าใครเป็นผู้ชนะและบันทึกข้อความสรุปสาเหตุ

---

### ส่วนที่ 3: การจัดการแสดงผลข้อความ (Pure UI Rendering)

#### `cardToString`
```typescript
export const cardToString = (card: Card): string => {
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds';
  const color = isRed ? ANSI.RED : '';
  return `${color}${card.value}${SUIT_SYMBOLS[card.suit]}${ANSI.RESET}`;
};
```
*   **การทำงาน**: แปลงไพ่แต่ละใบเป็นข้อความสั้นพร้อมสีตามชุดสี ANSI (สีแดงสำหรับ Hearts/Diamonds)
*   **เหตุผลการออกแบบ**: แม้การพิมพ์ออกหน้าจอจะมีจุดประสงค์เพื่อให้ผู้ใช้เห็น แต่วิธีการแปลงอ็อบเจกต์เป็นสตริงที่สวยงามนี้ทำอย่างบริสุทธิ์ (รับ `Card` คืนค่า `string`) ทำให้เราทดสอบรูปร่างการแสดงผลได้โดยไม่ต้องรันคำสั่งแสดงผลจริงใน Console

#### `renderHand`
```typescript
export const renderHand = (hand: Hand, hide: boolean = false): string => {
  if (hide) {
    return `[ ${hand.cards.map(() => '??').join(', ')} ]`;
  }
  return `[ ${hand.cards.map(cardToString).join(', ')} ]`;
};
```
*   **การทำงาน**: แปลงมือไพ่ทั้งมือให้เป็นรูปแบบอักษร (เช่น `[ K♥, 6♣ ]` หรือหากต้องการซ่อนจะแสดงเป็น `[ ??, ?? ]`)
*   **แนวคิด FP**: ใช้ **`.map()`** เพื่อแปลงสมาชิกทุกตัวในอาร์เรย์ไพ่โดยตรง ไม่มีการเข้าถึงดัชนีด้วยลูปเพื่อดึงข้อมูลทีละตัว

#### `renderPlayerSummary`
*   **การทำงาน**: สร้างสรุปข้อมูลของผู้เล่นในหนึ่งบรรทัด เช่น ชื่อ มือไพ่ปัจจุบัน แต้ม และเด็ง เพื่อแสดงสถานะให้เข้าใจง่าย

---

### ส่วนที่ 4: เปลือกนอกที่ควบคุมผลข้างเคียง (Impure Shell)

#### `impureShuffleDeck`
```typescript
export const impureShuffleDeck = (deck: readonly Card[]): readonly Card[] => {
  const mutableDeck = [...deck];
  for (let i = mutableDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mutableDeck[i], mutableDeck[j]] = [mutableDeck[j], mutableDeck[i]];
  }
  return mutableDeck;
};
```
*   **การทำงาน**: สลับลำดับสำรับไพ่ 52 ใบด้วยเทคนิค Fisher-Yates shuffle
*   **เหตุผลการออกแบบแบบ FP**: การสุ่มตัวเลขมีความไม่แน่นอนเชิงระบบ (Non-deterministic) ค่าสลับลำดับเปลี่ยนทุกครั้งที่รัน ฟังก์ชันนี้จึงระบุชัดเจนว่าเป็น **Impure Function** และถูกจำกัดขอบเขตเอาไว้ที่ขอบนอกสุดของโปรแกรม (Shell)

#### `runGame`
```typescript
const runGame = async (rl: readline.Interface): Promise<void> => { ... }
```
*   **การทำงาน**: ลูปควบคุมขั้นตอนดำเนินเกม (Game Loop) ที่ต้องจัดการกับความล่าช้าการทำงานของอินพุตผู้ใช้ (Asynchronous Input/Output)
*   **เหตุผลการออกแบบ**: เนื่องจากเป็นส่วนควบคุมอินเทอร์เฟซผู้ใช้ โค้ดส่วนนี้จึงคอยทำหน้าที่รับข้อมูลมาเป็นลำดับเหตุการณ์ แล้วส่งตัวแปรสถานะที่ไหลไปตามท่อฟังก์ชันบริสุทธิ์เพื่ออัปเดตค่า:
    1.  รับข้อมูลสุ่ม -> สร้างเกมด้วย `initializeGame`
    2.  พิมพ์ข้อความออกหน้าจอ -> รับค่า `y`/`n`
    3.  ส่งตัวเลือกไปคิดแต้มต่อ -> อัปเดตสถานะด้วย `drawPlayerCard` หรือ `stayPlayer`
    4.  ให้ระบบคิดแต้มเจ้ามือ -> รันต่อด้วย `dealerAutomatedTurn`
    5.  แสดงผลผู้ชนะ -> วนถามความสมัครใจเล่นรอบใหม่

#### `main` / ขอบเขตการทำงานจุดเริ่มต้น
```typescript
const main = async () => {
  const rl = readline.createInterface({ input, output });
  try {
    await runGame(rl);
  } finally {
    rl.close();
  }
};
```
*   **การทำงาน**: สร้างพอร์ตรอรับคำสั่ง I/O ควบคุมความปลอดภัยของพอร์ตด้วยบล็อก `try-finally` เพื่อให้แน่ใจว่าพอร์ต I/O จะปิดลงเสมอหลังสิ้นสุดการรันโปรแกรม

---

## 4. ทำไมดีไซน์แบบนี้ถึงโดดเด่นในหลักการเชิง Paradigm?

1.  **ไม่มีการเปลี่ยนแปลงในประวัติศาสตร์ (Time-Travel Debugging Friendly)**: ในช่วงเวลาระหว่างดำเนินเกม ค่า `state` จะถูกทับด้วยตัวแปรที่รับมาใหม่เป็นทอดๆ โดยไม่มีส่วนใดเลยที่อัปเดตออบเจกต์เดิมภายในหน่วยความจำ ทำให้เราสามารถบันทึกประวัติการเดินแต้ม (History of States) ได้ง่ายมาก ซึ่งเป็นประโยชน์ในการแก้บั๊ก ย้อนกลับไปดูกระดานก่อนหน้า หรือจำลองสถานการณ์ต่างๆ
2.  **แยกความรับผิดชอบชัดเจน (Separation of Concerns)**: กฎการคิดแต้มป๊อกเด้ง (Business Rules) ถูกซ่อนอยู่ใน Core อย่างปลอดภัยโดยไม่ปะปนกับวิธีอ่านข้อความ Console หรือรูปแบบการวาดหน้าจอ หากวันหนึ่งคุณต้องการเปลี่ยนหน้าจอแสดงผลไปสู่เว็บแอปพลิเคชัน (เช่น React/HTML) หรือระบบแอปมือถือ คุณสามารถนำโค้ดส่วนของ **Core Logic** ทั้งหมดไปใช้งานต่อได้ทันทีโดยไม่ต้องแก้ไขตรรกะคำนวณแม้แต่บรรทัดเดียว
3.  **ไม่มีข้อผิดพลาดแฝงจากตัวแปรภายนอก (Predictability)**: นักพัฒนาไม่ต้องกังวลเรื่องการมีตัวแปรโกลบอล (Global State) ที่ถูกแอบแก้ไขจากฟังก์ชันอื่นในขณะที่เกมดำเนินอยู่ เนื่องจากทุกฟังก์ชันจะรับอินพุตเข้าทางพารามิเตอร์และคืนทางส่งออกอย่างชัดเจนเสมอ
