import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';

/**
 * useOrderInitialize
 * * Firebase 실시간 구독 및 해제 생명주기만 관리합니다.
 * Zustand 안티패턴(전체 스토어 구독으로 인한 무한 리렌더링)을 방지하기 위해
 * 상태를 통째로 반환하지 않고 초기화 로직에만 집중합니다.
 */
export const useOrderInitialize = () => {
  const navigate = useNavigate();
  const initializeStore = useOrderStore(state => state.initializeStore);
  const cleanup = useOrderStore(state => state.cleanup);

  useEffect(() => {
    initializeStore(navigate);
    return () => {
      cleanup();
    };
  }, [initializeStore, cleanup, navigate]);
};