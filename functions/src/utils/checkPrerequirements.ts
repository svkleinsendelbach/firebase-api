import { AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { DatabaseType } from '../classes/DatabaseType';
import { Crypter } from '../crypter/Crypter';
import { checkFiatShamir, FiatShamirParameters } from './fiatShamir';
import { FirebaseDatabase } from './FirebaseDatabase';
import { Logger } from './Logger';
import { httpsError } from './utils';

export async function checkPrerequirements(
    parameters: {
        databaseType: DatabaseType,
        fiatShamirParameters: FiatShamirParameters,
    },
    logger: Logger,
    auth?: AuthData | 'notRequired'
) {
    logger.log('checkPrerequirements', { parameters, auth });

    // Check fiat shamir
    checkFiatShamir(parameters.fiatShamirParameters, parameters.databaseType, logger.nextIndent);

    // Check if user is authorized to call a function.
    if (auth === undefined)
        throw httpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', logger);
}

export type UserAuthenticationType = 'websiteEditing';

export namespace UserAuthenticationType {
    export function isValid(value: string): value is UserAuthenticationType {
        return [
            'websiteEditing'
        ].includes(value);
    }
}

export async function checkUserAuthentication(auth: AuthData | undefined, type: UserAuthenticationType, databaseType: DatabaseType, logger: Logger) {

    // Check if a user is signed in
    if (auth === undefined)
        throw httpsError('permission-denied', 'The function must be called while authenticated, nobody signed in.', logger);

    // Check if a user is authenticated
    const hashedUserId = Crypter.sha512(auth.uid);
    const reference = FirebaseDatabase.Reference.fromPath(`users/authentication/${type}/${hashedUserId}/state`, databaseType);
    const snapshot = await reference.snapshot<'authenticated' | 'unauthenticated'>();
    if (!snapshot.exists || snapshot.value !== 'authenticated')
        throw httpsError('permission-denied', `The function must be called while authenticated, not authenticated in for ${type}.`, logger);    
}
