/* eslint-disable fp/no-unused-expression */
import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyEventDispatcher, TinyEventListener } from '@konker.dev/tiny-event-fp';
import * as TE from '@konker.dev/tiny-event-fp';

/*
export type TinyStateMachine<S, E, D> = {
  readonly transition: (fromState: S, eventType: E, toState: S) => TinyStateMachine<S, E, D>;
  readonly trigger: (event: E, eventData?: D) => TinyStateMachine<S, E, D>;
  readonly restart: () => TinyStateMachine<S, E, D>;
  readonly onEvent: (event: E, listener: TinyEventListener<E, D>) => TinyStateMachine<S, E, D>;
  readonly onEnterState: (state: S, listener: TinyEventListener<S, D>) => TinyStateMachine<S, E, D>;
  readonly onExitState: (state: S, listener: TinyEventListener<S, D>) => TinyStateMachine<S, E, D>;
};
*/
export type FsmKey<S extends string, E extends string> = `${S},${E}`;

export type TinyStateMachine<S extends string, E extends string, A> = {
  readonly startingState: S;
  readonly currentState: S;
  readonly stateMap: Map<FsmKey<S, E>, S>;
  readonly onEventDispatcher: TinyEventDispatcher<E, A>;
  readonly onEnterStateEventDispatcher: TinyEventDispatcher<S, A>;
  readonly onExitStateEventDispatcher: TinyEventDispatcher<S, A>;
};

//---------------------------------------------------------------------------
// Helper
function fsmKey<S extends string, E extends string>(fromState: S, eventType: E): FsmKey<S, E> {
  return [fromState, eventType].join(',') as FsmKey<S, E>;
}

function executeTransition<S extends string, E extends string, A>(
  stateMachine: TinyStateMachine<S, E, A>,
  toState: S,
  eventData?: A
): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> {
  return P.pipe(
    P.Effect.succeed(stateMachine),
    P.Effect.tap((stateMachine) =>
      P.pipe(stateMachine.onExitStateEventDispatcher, TE.notify(stateMachine.currentState, eventData))
    ),
    P.Effect.map((stateMachine) => ({
      ...stateMachine,
      currentState: toState as S,
    })),
    P.Effect.tap((stateMachine) =>
      P.pipe(stateMachine.onEnterStateEventDispatcher, TE.notify(stateMachine.currentState, eventData))
    )
  );
}

//---------------------------------------------------------------------------
export function createTinyStateMachine<S extends string, E extends string, A>(
  startingState: S
): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> {
  return P.pipe(
    P.Effect.succeed({
      startingState,
      currentState: startingState,
      stateMap: new Map(),
    }),
    P.Effect.flatMap((ret) => {
      return P.pipe(
        TE.createTinyEventDispatcher<E, A>(),
        P.Effect.map((onEventDispatcher) => {
          return {
            ...ret,
            onEventDispatcher,
          };
        })
      );
    }),
    P.Effect.flatMap((ret) => {
      return P.pipe(
        TE.createTinyEventDispatcher<S, A>(),
        P.Effect.map((onEnterStateEventDispatcher) => {
          return {
            ...ret,
            onEnterStateEventDispatcher,
          };
        })
      );
    }),
    P.Effect.flatMap((ret) => {
      return P.pipe(
        TE.createTinyEventDispatcher<S, A>(),
        P.Effect.map((onExitStateEventDispatcher) => {
          return {
            ...ret,
            onExitStateEventDispatcher,
          };
        })
      );
    })
  );
}

export const transition =
  <S extends string, E extends string, A>(fromState: S, eventType: E, toState: S) =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> =>
    P.pipe(
      P.Effect.succeed(stateMachine),
      P.Effect.tap((stateMachine) => P.Effect.succeed(stateMachine.stateMap.set(fsmKey(fromState, eventType), toState)))
    );

export const trigger =
  <S extends string, E extends string, A>(event: E, eventData?: A) =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> => {
    return P.pipe(
      P.Effect.succeed(stateMachine),
      // Notify listeners
      P.Effect.tap((stateMachine) => P.pipe(stateMachine.onEventDispatcher, TE.notify(event, eventData))),
      P.Effect.flatMap((stateMachine) => {
        const toState = stateMachine.stateMap.get(fsmKey(stateMachine.currentState, event));
        return toState ? executeTransition(stateMachine, toState, eventData) : P.Effect.succeed(stateMachine);
      })
    );
  };

export const restart =
  <S extends string, E extends string, A>() =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> => {
    return executeTransition(stateMachine, stateMachine.startingState);
  };

export const onEvent =
  <S extends string, E extends string, A>(event: E, listener: TinyEventListener<E, A>) =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> =>
    P.pipe(
      P.Effect.succeed(stateMachine),
      P.Effect.tap((stateMachine) => P.pipe(stateMachine.onEventDispatcher, TE.addListener(event, listener)))
    );

export const onEnterState =
  <S extends string, E extends string, A>(state: S, listener: TinyEventListener<S, A>) =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> =>
    P.pipe(
      P.Effect.succeed(stateMachine),
      P.Effect.tap((stateMachine) => P.pipe(stateMachine.onEnterStateEventDispatcher, TE.addListener(state, listener)))
    );

export const onExitState =
  <S extends string, E extends string, A>(state: S, listener: TinyEventListener<S, A>) =>
  (stateMachine: TinyStateMachine<S, E, A>): P.Effect.Effect<never, Error, TinyStateMachine<S, E, A>> =>
    P.pipe(
      P.Effect.succeed(stateMachine),
      (x) => x,
      P.Effect.tap((stateMachine) => P.pipe(stateMachine.onExitStateEventDispatcher, TE.addListener(state, listener))),
      (x) => x
    );
