import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const useModals = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({
    sale: false,
    purchase: false,
    product: false,
    export: false,
    saleDetail: false,
    editPurchase: false,
    editSale: false
  });

  const [modalData, setModalData] = useState(null);

  const openModal = (type, data = null) => {
    setModals(prev => ({ ...prev, [type]: true }));
    setModalData(data);
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setModalData(null);
  };

  return (
    <ModalContext.Provider value={{ modals, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
