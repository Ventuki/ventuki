export interface POSLoadingStates {
  searchingProducts: boolean;
  creatingSale: boolean;
  processingPayment: boolean;
}

export const initialPOSLoadingStates: POSLoadingStates = {
  searchingProducts: false,
  creatingSale: false,
  processingPayment: false,
};
