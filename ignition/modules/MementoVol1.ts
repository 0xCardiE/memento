import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MementoVol1Module", (m) => {
  // Deploy the MementoVol1 contract
  const mementoVol1 = m.contract("MementoVol1");

  // Create a sample memento after deployment (optional)
  m.call(mementoVol1, "createMemento", [
    "Genesis Memento",
    "This is the first memento created upon deployment of MementoVol1 contract."
  ]);

  return { mementoVol1 };
}); 