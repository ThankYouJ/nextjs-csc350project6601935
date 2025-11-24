import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../../../utils/contractConfig";

export async function GET() {
  try {
    const rpc = process.env.SEPOLIA_RPC_URL;
    const pk = process.env.ADMIN_PRIVATE_KEY;

    if (!rpc || !pk || !CONTRACT_ADDRESS) {
      return NextResponse.json({ error: "Missing config" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const admins = await contract.getAllAdmins();

    return NextResponse.json({ admins });
  } catch (err) {
    console.error("ADMIN LIST ERROR:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
