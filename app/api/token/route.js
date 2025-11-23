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

const MERCHANT_ROLE = '0x3c4a2d89ed8b4cf4347fec87df1c38410f8fc538bf9fd64c10f2717bc0feff36';

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

    // ----- reward (merchant gives RTK) -----
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

    // ----- redeemFrom (take RTK back) -----
    if (action === 'redeem') {
      if (!address || amount == null) {
        return NextResponse.json({ error: 'Missing address or amount' }, { status: 400 });
      }

      const amt = ethers.parseUnits(amount.toString(), decimals);
      const tx = await contract.redeemFrom(address, amt);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- setMerchant (grant MERCHANT_ROLE) -----
    if (action === 'setMerchant') {
      if (!address) {
        return NextResponse.json({ error: 'Missing merchant address' }, { status: 400 });
      }

      const tx = await contract.setMerchant(address);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- removeMerchant (revoke MERCHANT_ROLE) -----
    if (action === 'removeMerchant') {
      if (!address) {
        return NextResponse.json({ error: 'Missing merchant address' }, { status: 400 });
      }

      const tx = await contract.removeMerchant(address);
      const rc = await tx.wait();

      return NextResponse.json({
        txHash: rc.hash,
        status: rc.status,
      });
    }

    // ----- isMerchant (check MERCHANT_ROLE) -----
    if (action === 'isMerchant') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const has = await contract.hasRole(MERCHANT_ROLE, address);
      return NextResponse.json({ isMerchant: has });
    }



    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('TOKEN API ERROR:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 },
    );
  }
}
