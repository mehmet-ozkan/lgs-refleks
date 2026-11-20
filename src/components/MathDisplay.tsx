import React from 'react';
import { MathPart } from '../types/game';

interface MathDisplayProps {
  parts: MathPart[];
  size?: 'lg' | 'md' | 'sm';
}

export const MathDisplay: React.FC<MathDisplayProps> = ({ parts, size = 'lg' }) => {
  return (
    <span className={`math-expr math-expr--${size}`}>
      {parts.map((part, idx) => {
        switch (part.type) {
          case 'text':
            return (
              <span key={idx} className="math-text">
                {part.value}
              </span>
            );
          case 'highlight':
            return (
              <span key={idx} className="math-highlight">
                {part.value}
              </span>
            );
          case 'blank':
            return (
              <span key={idx} className="math-blank">
                {part.text ?? '?'}
              </span>
            );
          case 'power':
            return (
              <span key={idx} className="math-power">
                <span className="math-base">{part.base}</span>
                <sup
                  className={
                    part.highlightExp ? 'math-exp math-exp--blank' : 'math-exp'
                  }
                >
                  {part.exp}
                </sup>
              </span>
            );
          case 'sqrt':
            return (
              <span key={idx} className="math-sqrt">
                <span className="math-sqrt-sign" aria-hidden="true">
                  √
                </span>
                <span
                  className={
                    part.highlightInside
                      ? 'math-sqrt-radicand math-sqrt-radicand--blank'
                      : 'math-sqrt-radicand'
                  }
                >
                  {part.value}
                </span>
              </span>
            );
          case 'radical':
            return (
              <span key={idx} className="math-radical">
                <span className="math-coeff">{part.coeff}</span>
                <span className="math-sqrt">
                  <span className="math-sqrt-sign" aria-hidden="true">
                    √
                  </span>
                  <span className="math-sqrt-radicand">{part.radicand}</span>
                </span>
              </span>
            );
        }
      })}
    </span>
  );
};
