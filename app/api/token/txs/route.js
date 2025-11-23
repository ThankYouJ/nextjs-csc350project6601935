import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../../../../utils/contractConfig';

export async function GET() {
  try {
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Missing contract address' },
        { status: 400 }
      );
    }

    // Blockscout Sepolia API (Etherscan-compatible)
    const url =
      `https://eth-sepolia.blockscout.com/api` +
      `?module=account&action=tokentx&contractaddress=${CONTRACT_ADDRESS}` +
      `&sort=desc`;

    const res = await fetch(url, {
      // optional: cache for a short time
      next: { revalidate: 15 },
    });
    const data = await res.json();

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return NextResponse.json(
        { error: 'Unable to fetch token txs from Blockscout' },
        { status: 500 }
      );
    }

    // Simplify + format token value using decimals from Blockscout
    const txs = data.result.map((tx) => {
      const decimals = Number(tx.tokenDecimal || '18');
      const valueFormatted = ethers.formatUnits(tx.value, decimals);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        valueFormatted,          // human readable string
        tokenSymbol: tx.tokenSymbol,
        timeStamp: Number(tx.timeStamp), // seconds
      };
    });

    return NextResponse.json({ txs });
  } catch (err) {
    console.error('TX API ERROR:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
