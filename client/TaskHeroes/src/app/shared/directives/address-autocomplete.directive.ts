import { Directive, ElementRef, OnInit, Output, EventEmitter, inject } from '@angular/core';

export interface AddressDetails {
  fullAddress: string;
  zipCode: string;
}

@Directive({
  selector: '[appAddressAutocomplete]',
  standalone: true,
})
export class AddressAutocompleteDirective implements OnInit {
  
  private el = inject(ElementRef);
  private autocomplete: google.maps.places.Autocomplete | undefined;

  // Emits the validated address and zip code
  @Output() addressSelected = new EventEmitter<AddressDetails>();

  ngOnInit(): void {
    // We use a setTimeout to ensure the Google Maps script is fully loaded,
    // although generally, if the script is in index.html, it's ready.
    setTimeout(() => {
      this.initAutocomplete();
    }, 100);
  }

  private initAutocomplete(): void {
    // Check if the Google Maps library is available
    if (typeof google !== 'undefined' && google.maps.places) {
      const inputElement = this.el.nativeElement;

      this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ['address'], // Restrict suggestions to addresses
        componentRestrictions: { 'country': ['us'] }, // Optional: US only
        fields: ['address_components', 'formatted_address', 'name', 'geometry'],
      });

      this.autocomplete.addListener('place_changed', () => {
        this.onPlaceChanged();
      });
    } else {
      console.warn('Google Maps or Places library not loaded.');
    }
  }

  private onPlaceChanged(): void {
    const place = this.autocomplete!.getPlace();
    if (!place.geometry) {
      // User entered text but did not select a suggestion
      return;
    }

    let zipCode = '';
    const addressComponents = place.address_components;

    // Extract the ZIP code from the address components
    for (const component of addressComponents!) {
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name;
        break;
      }
    }

    this.addressSelected.emit({
      fullAddress: place.formatted_address || place.name || this.el.nativeElement.value,
      zipCode: zipCode,
    });
  }
}