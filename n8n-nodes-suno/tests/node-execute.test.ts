import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { Suno } from '../nodes/Suno/Suno.node';
import { createMockContext } from './helpers/mockContext';

const TWO_ITEMS: INodeExecutionData[] = [{ json: { a: 1 } }, { json: { a: 2 } }];

async function run(response: unknown, items = TWO_ITEMS, opts: { continueOnFail?: boolean } = {}) {
	const ctx = createMockContext({ resource: 'credit', operation: 'get' }, response);
	ctx.getInputData.mockReturnValue(items);
	ctx.continueOnFail.mockReturnValue(opts.continueOnFail ?? false);
	const out = await new Suno().execute.call(ctx as unknown as IExecuteFunctions);
	return { out: out[0], ctx };
}

describe('Suno.execute pairedItem', () => {
	it('should link each output to its input item when the API returns a single object', async () => {
		const { out } = await run({ code: 200, data: { credits: 5 } });
		expect(out).toEqual([
			{ json: { credits: 5 }, pairedItem: { item: 0 } },
			{ json: { credits: 5 }, pairedItem: { item: 1 } },
		]);
	});

	it('should link every element of an array response to its input item', async () => {
		const { out } = await run({ code: 200, data: [{ id: 'x' }, { id: 'y' }] }, [{ json: {} }]);
		expect(out).toEqual([
			{ json: { id: 'x' }, pairedItem: { item: 0 } },
			{ json: { id: 'y' }, pairedItem: { item: 0 } },
		]);
	});

	it('should link the success placeholder when the API returns nothing', async () => {
		const { out } = await run('', [{ json: {} }]);
		expect(out).toEqual([{ json: { success: true }, pairedItem: { item: 0 } }]);
	});

	it('should link error items when continueOnFail is on', async () => {
		const { out } = await run({ code: 400, msg: 'bad' }, [{ json: {} }], { continueOnFail: true });
		expect(out).toHaveLength(1);
		expect(out[0].pairedItem).toEqual({ item: 0 });
		expect(out[0].json.error).toEqual(expect.any(String));
	});
});

describe('Suno.execute error wrapping', () => {
	it('should rethrow the original NodeApiError unchanged', async () => {
		const ctx = createMockContext({ resource: 'credit', operation: 'get' }, { code: 400, msg: 'bad' });
		await expect(new Suno().execute.call(ctx as unknown as IExecuteFunctions)).rejects.toBeInstanceOf(
			NodeApiError,
		);
	});

	it('should wrap a plain error as NodeOperationError with the item index', async () => {
		const ctx = createMockContext({ resource: 'credit', operation: 'nope' });
		ctx.getInputData.mockReturnValue(TWO_ITEMS);
		const err = await new Suno()
			.execute.call(ctx as unknown as IExecuteFunctions)
			.catch((e: unknown) => e);
		expect(err).toBeInstanceOf(NodeOperationError);
		expect((err as NodeOperationError).message).toBe('Unknown credit operation: nope');
		expect((err as NodeOperationError).context.itemIndex).toBe(0);
	});
});
