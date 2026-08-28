import crypto from "crypto"


const KEY_LENGTH = 64;

export function hashPassword(password: string): Promise<string> {

    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString("hex");

        crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }

            const hash = derivedKey.toString("hex");

            resolve(`${salt}:${hash}`);
        });
    });
}

export function verifyPassword(
    password: string,
    storedPassword: string
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const [salt, storedHash] = storedPassword.split(":");

        if (!salt || !storedHash) {
            resolve(false);
            return;
        }

        crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }

            const hash = derivedKey.toString("hex");

            resolve(
                crypto.timingSafeEqual(
                    Buffer.from(hash, "hex"),
                    Buffer.from(storedHash, "hex")
                )
            );
        });
    });
}