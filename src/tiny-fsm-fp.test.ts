import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './tiny-fsm-fp';

export type AppState = 'ST_IDLE' | 'ST_5C' | 'ST_10C' | 'ST_15C' | 'ST_20C' | 'ST_VEND' | 'ST_CHANGE' | 'ST_ERROR';
export type AppEvent = 'EV_ENTER_5C' | 'EV_ENTER_10C' | 'EV_ENTER_15C' | 'EV_ENTER_20C' | 'EV_CHOOSE' | 'EV_ANY';

describe('TinyFsm', () => {
  const l1 = jest.fn((_t: AppState, _d?: string) => P.Effect.unit);
  const l2 = jest.fn((_t: AppState, _d?: string) => P.Effect.unit);
  const l3 = jest.fn((_t: AppEvent, _d?: string) => P.Effect.unit);

  it('should function as expected', async () => {
    const fsm = unit.createTinyStateMachine<AppState, AppEvent, string>('ST_IDLE');
    const prog = P.pipe(
      fsm,
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_IDLE', 'EV_ENTER_5C', 'ST_5C')),
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_5C', 'EV_ENTER_5C', 'ST_10C')),
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_5C', 'EV_ENTER_10C', 'ST_15C')),
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_IDLE', 'EV_ENTER_10C', 'ST_10C')),
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_IDLE', 'EV_ENTER_15C', 'ST_15C')),
      P.Effect.flatMap(unit.transition<AppState, AppEvent, string>('ST_IDLE', 'EV_ENTER_20C', 'ST_20C')),
      P.Effect.flatMap(unit.onEnterState<AppState, AppEvent, string>('ST_5C', l1)),
      P.Effect.flatMap(unit.onExitState<AppState, AppEvent, string>('ST_5C', l2)),
      P.Effect.flatMap(unit.onEvent<AppState, AppEvent, string>('EV_ENTER_5C', l3)),
      P.Effect.flatMap(unit.trigger<AppState, AppEvent, string>('EV_ENTER_5C', '5C')),
      P.Effect.flatMap(unit.trigger<AppState, AppEvent, string>('EV_ENTER_10C', '10C')),
      P.Effect.flatMap(unit.trigger<AppState, AppEvent, string>('EV_ENTER_10C', '15C')),
      P.Effect.flatMap(unit.restart<AppState, AppEvent, string>()),
      P.Effect.flatMap(unit.trigger<AppState, AppEvent, string>('EV_ENTER_5C', '5C')),
      P.Effect.flatMap(unit.trigger<AppState, AppEvent, string>('EV_ENTER_20C', '20C'))
    );

    const result = await P.Effect.runPromise(prog);
    expect(result.currentState).toEqual('ST_5C');
    expect(l1).toHaveBeenCalledTimes(2);
    expect(l2).toHaveBeenCalledTimes(1);
    expect(l3).toHaveBeenCalledTimes(2);
  });
});
