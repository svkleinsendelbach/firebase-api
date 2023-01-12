import fetch from 'cross-fetch';

import { AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { recaptchaSecretKey } from '../privateKeys';
import { checkPrerequirements } from '../utils/checkPrerequirements';
import { DatabaseType } from '../classes/DatabaseType';
import { FirebaseFunction } from '../utils/FirebaseFunction';
import { Logger } from '../utils/Logger';
import { ParameterContainer } from '../utils/Parameter/ParameterContainer';
import { ParameterParser } from '../utils/Parameter/ParameterParser';
import { ParameterBuilder } from '../utils/Parameter/ParameterBuilder';
import { FiatShamirParameters } from '../classes/FiatShamirParameters';

export class VerifyRecaptchaFunction implements FirebaseFunction<
    VerifyRecaptchaFunction.Parameters,
    VerifyRecaptchaFunction.ReturnType
> {

    public parameters: VerifyRecaptchaFunction.Parameters;

    private logger: Logger;

    public constructor(data: any, auth: AuthData | undefined) {
        this.logger = Logger.start(data.verbose, 'VerifyRecaptchaFunction.constructor', { data, auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, this.logger.nextIndent);
        const parameterParser = new ParameterParser<VerifyRecaptchaFunction.Parameters>(
            {
                fiatShamirParameters: ParameterBuilder.builder('object', FiatShamirParameters.fromObject),
                databaseType: ParameterBuilder.builder('string', DatabaseType.fromString),
                token: ParameterBuilder.trivialBuilder('string')
            },
            this.logger.nextIndent
        );
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<VerifyRecaptchaFunction.ReturnType> {
        this.logger.log('VerifyRecaptchaFunction.executeFunction', {}, 'info');
        await checkPrerequirements(this.parameters, this.logger.nextIndent, 'notRequired');
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${this.parameters.token}`;
        return await (await fetch(url)).json();
    }
}

export namespace VerifyRecaptchaFunction {
    export type Parameters = FirebaseFunction.DefaultParameters & {
        token: string
    }

    export type ReturnType = VerifyRecaptchaFunction.VerifyResponse;

    export interface VerifyResponse {
        success: boolean;
        score: number;
        action: string;
        challenge_ts: string;
        hostname: string;
        errorCodes?: string[];
    }

    export type CallParameters = {
        token: string
    }
}
