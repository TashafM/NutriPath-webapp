// Run: node app/api/razorpay/signature.check.mjs
import assert from "assert";
import crypto from "crypto";
import { validSignature } from "./lib.js";

const secret = "test_secret";
const good = crypto.createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
assert(validSignature("order_1|pay_1", good, secret));
assert(!validSignature("order_1|pay_2", good, secret));
assert(!validSignature("order_1|pay_1", "short", secret));
assert(!validSignature("order_1|pay_1", undefined, secret));
console.log("signature checks pass");
