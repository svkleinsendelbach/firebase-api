import { type DatabaseType, type FirebaseFunction, HttpsError, ParameterContainer, ParameterParser, type ILogger, type FunctionType } from 'firebase-function';
import { getPrivateKeys } from '../privateKeys';
import { type AuthData } from 'firebase-functions/lib/common/providers/tasks';
import { DatabaseScheme } from '../DatabaseScheme';

export class DeleteAllDataFunction implements FirebaseFunction<DeleteAllDataFunctionType> {
    public readonly parameters: FunctionType.Parameters<DeleteAllDataFunctionType> & { databaseType: DatabaseType };

    public constructor(data: Record<string, unknown> & { databaseType: DatabaseType }, auth: AuthData | undefined, private readonly logger: ILogger) {
        this.logger.log('DeleteAllDataFunction.constructor', { data: data, auth: auth }, 'notice');
        const parameterContainer = new ParameterContainer(data, getPrivateKeys, this.logger.nextIndent);
        const parameterParser = new ParameterParser<FunctionType.Parameters<DeleteAllDataFunctionType>>({}, this.logger.nextIndent);
        parameterParser.parseParameters(parameterContainer);
        this.parameters = parameterParser.parameters;
    }

    public async executeFunction(): Promise<FunctionType.ReturnType<DeleteAllDataFunctionType>> {
        this.logger.log('DeleteAllDataFunction.executeFunction', {}, 'info');
        if (this.parameters.databaseType.value !== 'testing')
            throw HttpsError('failed-precondition', 'Function can only be called for testing.', this.logger);
        const reference = DatabaseScheme.reference(this.parameters.databaseType);
        await reference.remove();
    }
}

export type DeleteAllDataFunctionType = FunctionType<Record<string, never>, void>;
