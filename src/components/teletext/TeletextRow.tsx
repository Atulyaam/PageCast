import React from "react";
import type { TeletextRow as TeletextRowType } from "@/domain/teletext/types";
import { TeletextCell } from "./TeletextCell";

export interface TeletextRowProps {
  readonly row: TeletextRowType;
  readonly rowIndex: number;
  readonly language?: "en" | "hi";
  readonly className?: string;
}

export const TeletextRow: React.FC<TeletextRowProps> = ({
  row,
  rowIndex,
  language = "en",
  className = "",
}) => {
  const isHindi = language === "hi";

  return (
    <div
      role="row"
      aria-rowindex={rowIndex + 1}
      className={`flex flex-row overflow-hidden leading-tight whitespace-pre ${
        isHindi ? "teletext-hindi" : "teletext-grid-container"
      } ${className}`.trim()}
    >
      {row.spans.map((span, spanIndex) => (
        <TeletextCell
          key={`span-${rowIndex}-${spanIndex}`}
          text={span.text}
          color={span.color}
          doubleHeight={span.doubleHeight}
          mosaic={span.mosaic}
        />
      ))}
    </div>
  );
};
