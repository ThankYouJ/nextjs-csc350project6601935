// app/api/token/route.js
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../../utils/contractConfig';

let cachedDecimals = null;

async function getContract() {
  const rpc = process.env.SEPOLIA_RPC_URL;
  const pk = process.env.ADMIN_PRIVATE_KEY;
  
  if (!rpc || !pk || !CONTRACT_ADDRESS) {
    throw new Error('Missing SEPOLIA_RPC_URL / ADMIN_PRIVATE_KEY / CONTRACT_ADDRESS');
  }
  
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  
  if (cachedDecimals === null) {
    cachedDecimals = await contract.decimals();
  }
  
  return { contract, decimals: cachedDecimals };
}

export async function POST(req) {
  try {
    const { action, address, amount } = await req.json();
    const { contract, decimals } = await getContract();

    // ----- balanceOf -----
    if (action === 'balanceOf') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const bal = await contract.balanceOf(address);           // big integer
      const formatted = ethers.formatUnits(bal, decimals);     // human string

      return NextResponse.json({
        balanceRaw: bal.toString(),
        balanceFormatted: formatted,
      });
    }

    // ----- reward (Admin gives RTK) -----
    if (action === 'reward') {
      if (!address || amount == null) {
        return NextResponse.json({ error: 'Missing address or amount' }, { status: 400 });
      }

      // amount is in RTK (e.g. "10.5"), convert to smallest unit
      const amt = ethers.parseUnits(amount.toString(), decimals);
      const tx = await contract.reward(address, amt);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- redeem (Burn RTK away) -----
    if (action === 'redeem') {
      if (!address || amount == null) {
        return NextResponse.json({ error: 'Missing address or amount' }, { status: 400 });
      }

      const amt = ethers.parseUnits(amount.toString(), decimals);
      const tx = await contract.redeem(amt);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

        // ----- isAdmin (check DEFAULT_ADMIN_ROLE) -----
    if (action === 'isAdmin') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      // Uses your hasAdminRole helper in the contract
      const has = await contract.hasAdminRole(address);
      return NextResponse.json({ isAdmin: has });
    }

    // ----- addAdmin -----
    if (action === 'addAdmin') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const tx = await contract.addAdmin(address);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- removeAdmin -----
    if (action === 'removeAdmin') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const tx = await contract.removeAdmin(address);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- withdraw ETH (amount in ETH from UI) -----
    if (action === 'withdraw') {
      if (!address || amount == null) {
        return NextResponse.json({ error: 'Missing address or amount' }, { status: 400 });
      }

      // amount is in ETH as string, convert to wei
      const weiAmount = ethers.parseEther(amount.toString());
      const tx = await contract.withdraw(address, weiAmount);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // End of functions
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('TOKEN API ERROR:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 },
    );
  }
}
