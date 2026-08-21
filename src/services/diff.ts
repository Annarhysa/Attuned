export interface DiffToken {
  text: string;
  type: 'same' | 'added' | 'removed';
}

/** Word-level diff for before/after highlighting. Simple LCS-based approach -- fine at resume-bullet scale. */
export function wordDiff(before: string, after: string): DiffToken[] {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      tokens.push({ text: a[i], type: 'same' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      tokens.push({ text: a[i], type: 'removed' });
      i++;
    } else {
      tokens.push({ text: b[j], type: 'added' });
      j++;
    }
  }
  while (i < m) tokens.push({ text: a[i++], type: 'removed' });
  while (j < n) tokens.push({ text: b[j++], type: 'added' });

  return tokens.filter((t) => t.text.length > 0);
}
