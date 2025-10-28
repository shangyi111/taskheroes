import { Directive, ElementRef, OnInit, Output, EventEmitter, inject, NgZone } from '@angular/core';
import { environment } from 'src/environments/environment'; 

declare var google: any;

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
  private ngZone = inject(NgZone);
  private autocomplete: google.maps.places.Autocomplete | undefined;

  // Emits the validated address and zip code
  @Output() addressSelected = new EventEmitter<AddressDetails>();

  ngOnInit(): void {
    // 🚨 Start by loading the Google Maps script dynamically
    this.loadGoogleMapsScript(() => {
      // Once the script is loaded and 'google' is defined, initialize Autocomplete
      this.initAutocomplete();
    });
  }

  // 🟢 NEW: Handles loading the Google Maps script
  private loadGoogleMapsScript(callback: () => void): void {
    // 1. Check if the script is already loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      callback();
      return;
    }
    
    // 2. Check if the script is already being added to avoid duplicates
    if (document.getElementById('google-maps-script')) {
      return;
    }

    // 3. Create the script element and inject the API key
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    // 4. Set the callback for when the script finishes loading
    script.onload = () => {
      // Use ngZone.run() to ensure that any initialization logic here 
      // (like subsequent service calls) is recognized by Angular.
      this.ngZone.run(() => {
        callback(); 
      });
    };
    
    document.head.appendChild(script);
  }

  private initAutocomplete(): void {
    // We already ensured 'google' is defined via the loader's callback
    const inputElement = this.el.nativeElement;

    this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
      types: ['address'], 
      componentRestrictions: { 'country': ['us'] }, 
      fields: ['address_components', 'formatted_address', 'name', 'geometry'],
    });

    // 🚨 Wrap listener in ngZone.run()
    this.autocomplete!.addListener('place_changed', () => {
      this.ngZone.run(() => { 
        this.onPlaceChanged();
      });
    });
  }

  private onPlaceChanged(): void {
    const place = this.autocomplete!.getPlace();
    if (!place.geometry) {
      // User entered text but did not select a suggestion
      return;
    }

    let zipCode = '';
    const addressComponents = place.address_components;

    // Extraction logic remains the same
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